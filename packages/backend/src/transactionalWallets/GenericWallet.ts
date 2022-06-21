import dayjs from "dayjs";
import { ObjectId } from "mongodb";
import { AvailableTickers, AvailableCoins } from "../currencies";
import mongoGenerator from "../mongoGenerator";
import { PaymentStatusType, ClassPayment } from "../types";

export default abstract class GenericWallet {
    public ticker: AvailableTickers;
    public coinName: AvailableCoins;
    protected _initialized = false;

    protected publicKey: string;
    protected privateKey: string;
    protected amount: number;
    protected expiresAt: Date;
    protected createdAt: Date;
    protected updatedAt: Date;
    protected status: PaymentStatusType;
    protected id: string;
    protected callbackUrl?: string;
    protected payoutTransactionHash?: string;

    constructor(public onDie: (id: string) => any) { }

    protected abstract _cashOut(balance: number): Promise<void>;
    abstract getBalance(): Promise<{ result: { confirmedBalance: number; unconfirmedBalance?: number; } }>;

    abstract fromNew(amount: number): Promise<this>;
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
        this.publicKey = initObj.publicKey;
        this.privateKey = initObj.privateKey;
        this.amount = initObj.amount;
        this.status = initObj.status;
        this.id = initObj.id;
        this.callbackUrl = initObj.callbackUrl;
        this.createdAt = initObj.createdAt;
        this.updatedAt = initObj.updatedAt;
        this.expiresAt = initObj.expiresAt;
        this.payoutTransactionHash = initObj.payoutTransactionHash;
        this._initialized = true;
        return this;
    }

    protected async _initInDatabase(publicKey: string, privateKey: string, amount: number, callbackUrl?: string): Promise<this> {
        const now = dayjs().toDate();
        const { db } = await mongoGenerator();
        const insertObj: Omit<ClassPayment, "id"> = {
            publicKey: publicKey,
            privateKey: privateKey,
            amount: amount,
            expiresAt: dayjs().add(+process.env.TRANSACTION_TIMEOUT!, 'seconds').toDate(),
            createdAt: now,
            updatedAt: now,
            status: "WAITING",
            callbackUrl: callbackUrl,
            currency: this.ticker
        };
        const { insertedId } = await db.collection('payments').insertOne(insertObj);
        return this.fromManual({
            ...insertObj,
            id: insertedId.toString()
        });
    }

    getKeypair() {
        if (!this._initialized) {
            return;
        }

        return {
            publicKey: this.publicKey,
            privateKey:this.privateKey
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
            callbackUrl: this.callbackUrl,
            payoutTransactionHash: this.payoutTransactionHash,
            currency: this.ticker
        }
    }

    async checkTransaction() {
        if (dayjs().isAfter(dayjs(this.expiresAt))) {
            this._updateStatus("EXPIRED");
            this.onDie(this.id);
            return;
        }
        const { result: { confirmedBalance } } = await this.getBalance();
        if (confirmedBalance >= (this.amount * (1 - +process.env.TRANSACTION_SLIPPAGE_TOLERANCE!))) {
            this._updateStatus("CONFIRMED");
            this._cashOut(confirmedBalance);
        } else if (confirmedBalance > 0) {
            this._updateStatus("PARTIALLY_PAID");
        }
    }

    protected async _updateStatus(status: PaymentStatusType, error?: string) {
        const { db } = await mongoGenerator();
        this.status = status;
        this.updatedAt = dayjs().toDate();
        if (error) {
            console.log(`Status updated on ${this.ticker} payment ${this.id} error: `, error);
            db.collection('payments').updateOne({ _id: new ObjectId(this.id) }, { $set: { status, updatedAt: this.updatedAt, error } })
        } else {
            console.log(`Status updated on ${this.ticker} payment ${this.id}: `, status);
            db.collection('payments').updateOne({ _id: new ObjectId(this.id) }, { $set: { status, updatedAt: this.updatedAt } })
        }
        if (this.callbackUrl) {
            const details: Record<string, any> = this.getDetails();
            delete details.privateKey;
            if (error) {
                (details as any).error = error;
            }
            fetch(this.callbackUrl, {
                method: "POST",
                body: JSON.stringify(details),
                headers: {
                    /** TODO: Hmac Verification */
                }
            })
        }
    }
}