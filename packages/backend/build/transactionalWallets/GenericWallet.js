"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dayjs_1 = __importDefault(require("dayjs"));
const mongodb_1 = require("mongodb");
const mongoGenerator_1 = __importDefault(require("../mongoGenerator"));
class GenericWallet {
    constructor(onDie) {
        this.onDie = onDie;
        this._initialized = false;
    }
    async fromPublicKey(publicKey) {
        const { db } = await (0, mongoGenerator_1.default)();
        const existingTransaction = await db.collection('transactions').findOne({ publicKey });
        if (existingTransaction) {
            this.fromManual({
                ...existingTransaction,
                id: existingTransaction._id.toString(),
            });
            return this;
        }
        else {
            throw new Error("No transaction with the corresponding public key found");
        }
    }
    async fromPaymentId(paymentId) {
        const { db } = await (0, mongoGenerator_1.default)();
        const existingTransaction = await db.collection('transactions').findOne({ _id: new mongodb_1.ObjectId(paymentId) });
        this.fromManual({
            ...existingTransaction,
            id: paymentId,
        });
        return this;
    }
    fromManual(initObj) {
        this._setFromObject(initObj);
        this._initialized = true;
        return this;
    }
    async _initInDatabase(obj) {
        const now = (0, dayjs_1.default)().toDate();
        const { db } = await (0, mongoGenerator_1.default)();
        const insertObj = {
            ...obj,
            amountPaid: 0,
            expiresAt: (0, dayjs_1.default)().add(+process.env.TRANSACTION_TIMEOUT, 'milliseconds').toDate(),
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
    _setFromObject(update) {
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
    getDetails() {
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
        };
    }
    async checkTransaction() {
        if ((0, dayjs_1.default)().isAfter((0, dayjs_1.default)(this.expiresAt))) {
            this._updateStatus({ status: "EXPIRED" });
            this.onDie(this.id);
            return;
        }
        const { result: { confirmedBalance } } = await this.getBalance();
        if (confirmedBalance >= (this.amount * (1 - +process.env.TRANSACTION_SLIPPAGE_TOLERANCE)) && this.status !== "CONFIRMED") {
            this._updateStatus({ status: "CONFIRMED" });
            this._cashOut(confirmedBalance);
        }
        else if (confirmedBalance > 0 && this.amountPaid !== confirmedBalance) {
            this._updateStatus({ status: "PARTIALLY_PAID", amountPaid: confirmedBalance });
        }
    }
    async _updateStatus(update, error) {
        const { db } = await (0, mongoGenerator_1.default)();
        update.updatedAt = (0, dayjs_1.default)().toDate();
        this._setFromObject(update);
        if (error) {
            console.log(`Status updated on ${this.currency} payment ${this.id} error: `, error);
            db.collection('payments').updateOne({ _id: new mongodb_1.ObjectId(this.id) }, { $set: update });
        }
        else {
            console.log(`Status updated on ${this.currency} payment ${this.id}: `, update.status);
            db.collection('payments').updateOne({ _id: new mongodb_1.ObjectId(this.id) }, { $set: update });
        }
        if (this.ipnCallbackUrl) {
            const details = this.getDetails();
            delete details.privateKey;
            if (error) {
                details.error = error;
            }
            fetch(this.ipnCallbackUrl, {
                method: "POST",
                body: JSON.stringify(details),
                headers: {
                /** TODO: Hmac Verification */
                }
            });
        }
    }
}
exports.default = GenericWallet;
//# sourceMappingURL=GenericWallet.js.map