import dayjs from "dayjs";
import { ObjectId } from "mongodb";
import { AvailableTickers, AvailableCoins } from "../currencies";
import mongoGenerator from "../mongoGenerator";
import { PaymentStatus } from "../types";
import { ab2str, str2ab } from "../utils";

interface InitObject {
    publicKey: string | Uint8Array;
    privateKey: string | Uint8Array;
    amount: number;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
    status: PaymentStatus;
    id: string;
    callbackUrl?: string;
    payoutTransactionHash?: string;
}

export default abstract class GenericWallet {
    protected ticker: AvailableTickers;
    protected coinName: AvailableCoins;
    protected _initialized = false;

    protected publicKey: Uint8Array;
    protected privateKey: Uint8Array;
    protected amount: number;
    protected expiresAt: Date;
    protected createdAt: Date;
    protected updatedAt: Date;
    protected status: PaymentStatus;
    protected id: string;
    protected callbackUrl?: string;
    protected payoutTransactionHash?: string;

    constructor(public onDie: (id: string) => any) { }

    abstract checkTransaction();
    abstract getBalance(): Promise<{ result: { confirmedBalance: number; unconfirmedBalance?: number; } }>;

    abstract fromNew(amount: number): this;
    async fromPublicKey(publicKey: string | Uint8Array): Promise<this> {
        const { db } = await mongoGenerator();
        const existingTransaction = await db.collection('transactions').findOne({ publicKey: typeof publicKey === "string" ? publicKey : ab2str(publicKey) });
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
    fromManual(initObj: InitObject): this {
        this.publicKey = typeof initObj.publicKey === "string" ? str2ab(initObj.publicKey) : initObj.publicKey;
        this.privateKey = typeof initObj.privateKey === "string" ? str2ab(initObj.privateKey) : initObj.privateKey;
        this.amount = initObj.amount;
        this.status = initObj.status;
        this.id = initObj.id;
        this.callbackUrl = initObj.callbackUrl;
        this.createdAt = dayjs(initObj.createdAt).toDate();
        this.updatedAt = dayjs(initObj.updatedAt).toDate();
        this.expiresAt = dayjs(initObj.expiresAt).toDate();
        this.payoutTransactionHash = initObj.payoutTransactionHash;
        this._initialized = true;
        return this;
    }

    protected async _fromGeneratedKeypair() {
        const { db } = await mongoGenerator();
        const insertObj: Omit<InitObject, "id"> & { currency: string } = {
            publicKey: ab2str(this.publicKey),
            privateKey: ab2str(this.privateKey),
            amount: this.amount,
            expiresAt: this.expiresAt,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            status: "WAITING",
            callbackUrl: this.callbackUrl,
            currency: this.ticker
        };
        const { insertedId } = await db.collection('transaction').insertOne(insertObj)
        this.fromManual({
            ...insertObj,
            publicKey: this.publicKey,
            privateKey: this.privateKey,
            id: insertedId.toString()
        })
    }

    getKeypair() {
        if (!this._initialized) {
            return;
        }

        return {
            publicKey: ab2str(this.publicKey),
            privateKey: ab2str(this.privateKey)
        };
    }
}