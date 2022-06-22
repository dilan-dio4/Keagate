import dayjs from "dayjs";
import { ObjectId } from "mongodb";
import { AvailableTickers, AvailableCoins, PaymentStatusType } from "@snow/common/src";
import mongoGenerator from "../mongoGenerator";
import { ClassPayment, IFromNew } from "../types";

export default abstract class GenericWallet {
    public currency: AvailableTickers;
    public coinName: AvailableCoins;
    protected _initialized = false;

    protected publicKey: string;
    protected privateKey: string;
    protected amount: number;
    protected amountPaid: number;
    protected expiresAt: Date;
    protected createdAt: Date;
    protected updatedAt: Date;
    protected status: PaymentStatusType;
    protected id: string;
    protected ipnCallbackUrl?: string;
    protected invoiceCallbackUrl?: string;
    protected payoutTransactionHash?: string;

    constructor(public onDie: (id: string) => any) { }

    protected abstract _cashOut(balance: number): Promise<void>;
    abstract getBalance(): Promise<{ result: { confirmedBalance: number; unconfirmedBalance?: number; } }>;

    abstract fromNew(obj: IFromNew): Promise<this>;
    async fromPublicKey(publicKey: string | Uint8Array): Promise<this> {
        const { db } = await mongoGenerator();
        const existingTransaction = await db.collection('transactions').findOne({ publicKey });
        if (existingTransaction) {
            this.fromManual({
                ...existingTransaction as any,
                id: existingTransaction._id.toString(),
            });
            return this;
        } else {
            throw new Error("No transaction with the corresponding public key found");
        }
    }
    async fromPaymentId(paymentId: string): Promise<this> {
        const { db } = await mongoGenerator();
        const existingTransaction = await db.collection('transactions').findOne({ _id: new ObjectId(paymentId) });
        this.fromManual({
            ...existingTransaction as any,
            id: paymentId,
        })
        return this;
    }
    fromManual(initObj: ClassPayment): this {
        this._setFromObject(initObj);
        this._initialized = true;
        return this;
    }

    protected async _initInDatabase(obj: IFromNew & { publicKey: string, privateKey: string; }): Promise<this> {
        const now = dayjs().toDate();
        const { db } = await mongoGenerator();
        const insertObj: Omit<ClassPayment, "id"> = {
            ...obj,
            amountPaid: 0,
            expiresAt: dayjs().add(+process.env.TRANSACTION_TIMEOUT!, 'milliseconds').toDate(),
            createdAt: now,
            updatedAt: now,
            status: "WAITING",
            currency: this.currency
        };
        const { insertedId } = await db.collection('payments').insertOne(insertObj);
        return this.fromManual({
            ...insertObj,
            id: insertedId.toString()
        });
    }

    private _setFromObject(update: Partial<ClassPayment>) {
        for (const [key, val] of Object.entries(update)) {
            this[key] = val;
        }
    }

    getKeypair() {
        if (!this._initialized) {
            return;
        }

        return {
            publicKey: this.publicKey,
            privateKey: this.privateKey
        };
    }

    getDetails(): ClassPayment {
        return {
            amount: this.amount,
            createdAt: this.createdAt,
            expiresAt: this.expiresAt,
            id: this.id,
            privateKey: this.privateKey,
            publicKey: this.publicKey,
            status: this.status,
            updatedAt: this.updatedAt,
            invoiceCallbackUrl: this.invoiceCallbackUrl,
            ipnCallbackUrl: this.ipnCallbackUrl,
            payoutTransactionHash: this.payoutTransactionHash,
            currency: this.currency,
            amountPaid: this.amountPaid
        }
    }

    async checkTransaction() {
        if (dayjs().isAfter(dayjs(this.expiresAt))) {
            this._updateStatus({ status: "EXPIRED" });
            this.onDie(this.id);
            return;
        }
        const { result: { confirmedBalance } } = await this.getBalance();
        if (confirmedBalance >= (this.amount * (1 - +process.env.TRANSACTION_SLIPPAGE_TOLERANCE!)) && this.status !== "CONFIRMED") {
            this._updateStatus({ status: "CONFIRMED" });
            this._cashOut(confirmedBalance);
        } else if (confirmedBalance > 0 && this.amountPaid !== confirmedBalance) {
            this._updateStatus({ status: "PARTIALLY_PAID", amountPaid: confirmedBalance });
        }
    }

    protected async _updateStatus(update: Partial<ClassPayment>, error?: string) {
        const { db } = await mongoGenerator();
        update.updatedAt = dayjs().toDate();
        this._setFromObject(update);
        if (error) {
            console.log(`Status updated on ${this.currency} payment ${this.id} error: `, error);
            db.collection('payments').updateOne({ _id: new ObjectId(this.id) }, { $set: update })
        } else {
            console.log(`Status updated on ${this.currency} payment ${this.id}: `, update.status);
            db.collection('payments').updateOne({ _id: new ObjectId(this.id) }, { $set: update })
        }
        if (this.ipnCallbackUrl) {
            const details: Partial<ClassPayment> = this.getDetails();
            delete details.privateKey;
            if (error) {
                (details as any).error = error;
            }
            fetch(this.ipnCallbackUrl, {
                method: "POST",
                body: JSON.stringify(details),
                headers: {
                    /** TODO: Hmac Verification */
                }
            })
        }
    }
}