import dayjs from "dayjs";
import { ObjectId } from "mongodb";
import { AvailableCurrencies, AvailableCoins, PaymentStatusType } from "@snow/common/src";
import mongoGenerator from "../mongoGenerator";
import { ClassPayment, ConcreteConstructor, IFromNew } from "../types";
import config from "../config";
import { GenericProvider } from "@snow/api-providers/src";
import currenciesToWallets from "../currenciesToWallets";
import GenericAdminWallet from "../adminWallets/GenericAdminWallet";

export default abstract class GenericTransactionalWallet {
    public currency: AvailableCurrencies;
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

    constructor(public onDie: (id: string) => any, public apiProvider: GenericProvider, public adminWalletClass: ConcreteConstructor<typeof GenericAdminWallet>) { }

    public getBalance?(): Promise<{ result: { confirmedBalance: number; unconfirmedBalance?: number; } }>;
    private sendTransaction?(destination: string, amount: number): Promise<{ result: string }>;
    protected async _cashOut(balance: number) {
        try {
            const [{ result: signature }] = await Promise.all([
                this.sendTransaction(config.getTyped(this.currency).ADMIN_PUBLIC_KEY, balance),
                this._updateStatus({ status: "SENDING" })
            ])
            this._updateStatus({ status: "FINISHED", payoutTransactionHash: signature });
            this.onDie(this.id);
        } catch (error) {
            this._updateStatus({ status: "FAILED" }, JSON.stringify(error));
            this.onDie(this.id);
        }
    }

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

    // This always gets called from the three `from` constructors
    fromManual(initObj: ClassPayment): this {
        this.getBalance = async () => ({ result: { confirmedBalance: 1 } }) // TODO: DROP
        this._setFromObject(initObj);
        const adminWalletMask = new this.adminWalletClass(this.publicKey, this.privateKey, this.apiProvider)
        this.getBalance = adminWalletMask.getBalance;
        this.sendTransaction = adminWalletMask.sendTransaction;
        this._initialized = true;
        return this;
    }

    protected async _initInDatabase(obj: IFromNew & { publicKey: string, privateKey: string; }): Promise<this> {
        const now = dayjs().toDate();
        const { db } = await mongoGenerator();
        const insertObj: Omit<ClassPayment, "id"> = {
            ...obj,
            amountPaid: 0,
            expiresAt: dayjs().add(config.getTyped('TRANSACTION_TIMEOUT'), 'milliseconds').toDate(),
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
        if (confirmedBalance >= (this.amount * (1 - config.getTyped('TRANSACTION_SLIPPAGE_TOLERANCE'))) && this.status !== "CONFIRMED") {
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