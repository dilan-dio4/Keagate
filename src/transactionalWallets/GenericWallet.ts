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
    public ticker: AvailableTickers;
    public coinName: AvailableCoins;
    public _initialized = false;

    public publicKey: Uint8Array;
    public privateKey: Uint8Array;
    public amount: number;
    public expiresAt: Date;
    public createdAt: Date;
    public updatedAt: Date;
    public status: PaymentStatus;
    public id: string;
    public callbackUrl?: string;
    public payoutTransactionHash?: string;

    abstract checkTransaction();
    abstract getBalance(): Promise<{ result: { confirmedBalance: number; unconfirmedBalance?: number; } }>;

    abstract fromNew(amount: number);
    async fromPublicKey(publicKey: string | Uint8Array) {
        const { db } = await mongoGenerator();
        const existingTransaction = await db.collection('transactions').findOne({ publicKey: typeof publicKey === "string" ? publicKey : ab2str(publicKey) });
        if (existingTransaction) {
            this._initialize({
                ...existingTransaction as any,
                id: existingTransaction._id.toString(),
            })
        } else {
            throw new Error("No transaction with the corresponding public key found");
        }
    }
    async fromPaymentId(paymentId: string) {
        const { db } = await mongoGenerator();
        const existingTransaction = await db.collection('transactions').findOne({ _id: new ObjectId(paymentId) });
        this._initialize({
            ...existingTransaction as any,
            id: paymentId,
        })
    }

    async _fromGeneratedKeypair() {
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
        this._initialize({
            ...insertObj,
            publicKey: this.publicKey,
            privateKey: this.privateKey,
            id: insertedId.toString()
        })
    }

    async _initialize(initObj: InitObject) {
        this.publicKey = typeof initObj.publicKey === "string" ? str2ab(initObj.publicKey) : initObj.publicKey;
        this.privateKey = typeof initObj.privateKey === "string" ? str2ab(initObj.privateKey) : initObj.privateKey;
        this.amount = initObj.amount;
        this.status = initObj.status;
        this.id = initObj.id;
        this.callbackUrl = initObj.callbackUrl;
        this.createdAt = initObj.createdAt;
        this.updatedAt = initObj.updatedAt;
        this.expiresAt = initObj.expiresAt;
        this.payoutTransactionHash = initObj.payoutTransactionHash;
        this._initialized = true;
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