import dayjs from 'dayjs';
import { ObjectId } from 'mongodb';
import { AvailableCurrencies, PaymentStatusType } from '@snow/common/src';
import mongoGenerator from '../mongo/generator';
import { MongoPayment, IFromNew, NativePaymentConstructor, CoinlibPaymentConstructor } from '../types';
import config from '../config';

export default abstract class GenericTransactionalWallet {
    public currency: AvailableCurrencies;
    protected type: 'coinlib' | 'native';
    protected _initialized = false;

    protected publicKey: string;
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

    protected onDie: (id: string) => any;

    // You implement these
    // --
    protected abstract _cashOut(balance?: number): Promise<string>;
    protected abstract _getBalance(): Promise<number>;
    // --

    protected abstract construct(constructor: NativePaymentConstructor | CoinlibPaymentConstructor): void;

    // fromManual always gets called from other `from` constructors
    public abstract fromNew(obj: IFromNew, constructor: NativePaymentConstructor | CoinlibPaymentConstructor): Promise<this>;
    public abstract getDetails(): MongoPayment;

    // This always gets called from the three `from` constructors
    public fromManual(initObj: MongoPayment, constructor: NativePaymentConstructor | CoinlibPaymentConstructor) {
        this.setFromObject(initObj);
        this.construct(constructor);
        this._initialized = true;
        return this;
    }

    public async checkTransaction() {
        if (!this._initialized) {
            return;
        } else if (dayjs().isAfter(dayjs(this.expiresAt))) {
            this.updateStatus({ status: 'EXPIRED' });
            this.onDie(this.id);
            return;
        }
        const confirmedBalance = await this._getBalance();
        if (confirmedBalance >= this.amount * (1 - config.getTyped('TRANSACTION_SLIPPAGE_TOLERANCE')) && this.status !== 'CONFIRMED') {
            this.updateStatus({ status: 'CONFIRMED', amountPaid: confirmedBalance });
            this._cashOut(confirmedBalance);
        } else if (confirmedBalance > 0 && this.amountPaid !== confirmedBalance) {
            this.updateStatus({ status: 'PARTIALLY_PAID', amountPaid: confirmedBalance });
        }
    }

    protected async cashOut(balance: number) {
        try {
            const [signature] = await Promise.all([this._cashOut(balance), this.updateStatus({ status: 'SENDING' })]);
            this.updateStatus({ status: 'FINISHED', payoutTransactionHash: signature });
            this.onDie(this.id);
        } catch (error) {
            this.updateStatus({ status: 'FAILED' }, JSON.stringify(error));
            this.onDie(this.id);
        }
    }

    protected async initInDatabase(obj: IFromNew & { publicKey: string; privateKey?: string; currency?: AvailableCurrencies }): Promise<MongoPayment> {
        const now = dayjs().toDate();
        const { db } = await mongoGenerator();
        const insertObj: Omit<MongoPayment, 'id'> = {
            amountPaid: 0,
            expiresAt: dayjs().add(config.getTyped('TRANSACTION_TIMEOUT'), 'milliseconds').toDate(),
            createdAt: now,
            updatedAt: now,
            status: 'WAITING',
            type: this.type,
            currency: this.currency,
            ...obj
        };
        const { insertedId } = await db.collection('payments').insertOne(insertObj);
        return {
            ...insertObj,
            id: insertedId.toString(),
        } as MongoPayment;
    }

    protected setFromObject(update: Partial<MongoPayment> | NativePaymentConstructor | CoinlibPaymentConstructor) {
        for (const [key, val] of Object.entries(update)) {
            this[key] = val;
        }
    }

    protected async updateStatus(update: Partial<MongoPayment>, error?: string) {
        const { db } = await mongoGenerator();
        update.updatedAt = dayjs().toDate();
        this.setFromObject(update);
        if (error) {
            console.log(`Status updated on ${this.currency} payment ${this.id} error: `, error);
            db.collection('payments').updateOne({ _id: new ObjectId(this.id) }, { $set: update });
        } else {
            console.log(`Status updated on ${this.currency} payment ${this.id}: `, update.status);
            db.collection('payments').updateOne({ _id: new ObjectId(this.id) }, { $set: update });
        }
        if (this.ipnCallbackUrl) {
            const details: MongoPayment = this.getDetails();
            delete details['privateKey'];
            if (error) {
                (details as any).error = error;
            }
            fetch(this.ipnCallbackUrl, {
                method: 'POST',
                body: JSON.stringify(details),
                headers: {
                    /** TODO: Hmac Verification */
                },
            });
        }
    }
}
