import dayjs from 'dayjs';
import { ObjectId } from 'mongodb';
import { AvailableCurrencies, ConcreteConstructor, PaymentStatusType } from '@keagate/common';
import mongoGenerator from '../mongo/generator';
import { MongoPayment, IFromNew, INativeInitInDatabase, ICoinlibInitInDatabase } from '../types';
import config from '../config';
import GenericAdminWallet from '../adminWallets/GenericAdminWallet';
import { AnyPayments } from 'coinlib-port';
import crypto from 'crypto';
import fetch from 'cross-fetch';
import logger from '../logger';

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
    protected extraId?: string;
    protected ipnCallbackUrl?: string;
    protected invoiceCallbackUrl?: string;
    protected payoutTransactionHash?: string;

    protected onDie: (id: string) => any;

    // You implement these
    // --
    protected abstract _cashOut(balance?: number): Promise<string>;
    protected abstract _getBalance(): Promise<number>;
    // --

    // fromManual always gets called from other `from` constructors
    public abstract fromNew(obj: IFromNew, constructor: NativePaymentConstructor | CoinlibPaymentConstructor): Promise<this>;
    public abstract getDetails(): MongoPayment;

    public abstract fromManual(initObj: MongoPayment, constructor?: NativePaymentConstructor | CoinlibPaymentConstructor);
    // This always gets called from the three `from` constructors

    public abstract checkTransaction(statusCallback: (status: PaymentStatusType) => any): Promise<void>;

    protected construct(constructor: CoinlibPaymentConstructor | NativePaymentConstructor): void {
        this.setFromObject(constructor);
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

    protected async initInDatabase(obj: INativeInitInDatabase | ICoinlibInitInDatabase): Promise<MongoPayment> {
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
            ...obj,
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
            logger.log(`Status updated on ${this.currency} payment ${this.id} error: `, error);
            db.collection('payments').updateOne({ _id: new ObjectId(this.id) }, { $set: update });
        } else {
            logger.log(`Status updated on ${this.currency} payment ${this.id}: `, update.status);
            db.collection('payments').updateOne({ _id: new ObjectId(this.id) }, { $set: update });
        }
        if (this.ipnCallbackUrl) {
            const sendIPN = (body: Record<string, any>, sig?: string) => {
                fetch(this.ipnCallbackUrl, {
                    method: 'POST',
                    body: JSON.stringify(body),
                    headers: {
                        'x-keagate-sig': sig,
                        'Content-Type': 'application/json',
                    },
                }).catch(err => logger.log("IPN Invoke failed with: ", JSON.stringify(err)));
            }
            if (config.has('IPN_HMAC_SECRET')) {
                const details: MongoPayment = this.getDetails();
                delete details['privateKey'];
                if (error) {
                    (details as any).error = error;
                }
                const hmac = crypto.createHmac('sha512', config.getTyped('IPN_HMAC_SECRET'));
                hmac.update(JSON.stringify(details, Object.keys(details).sort()));
                sendIPN(details, hmac.digest('hex'))
            } else {
                sendIPN({
                    error: 'No IPN_HMAC_SECRET configuration parameter set. Please set this up before using instant payment notifications. More information here: https://github.com/dilan-dio4/coinlib-port#instant-payment-notifications',
                }, undefined)
            }
        }
    }
}

interface PaymentConstructorRoot {
    onDie: (id: string) => any;
}

export interface NativePaymentConstructor extends PaymentConstructorRoot {
    adminWalletClass: ConcreteConstructor<typeof GenericAdminWallet>;
}

export interface CoinlibPaymentConstructor extends PaymentConstructorRoot {
    walletIndex: number;
    currency: AvailableCurrencies;
    coinlibPayment: AnyPayments<any>;
}
