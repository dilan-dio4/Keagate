import { ObjectId } from 'mongodb';
import mongoGenerator from '../../mongo/generator';
import { CoinlibPayment, IFromNew } from '../../types';
import config from '../../config';
import { AnyPayments } from 'coinlib-port';
import GenericTransactionalWallet from '../GenericTransactionalWallet';

export default class GenericCoinlibWrapper extends GenericTransactionalWallet {
    protected type = 'coinlib' as const;

    constructor(public onDie: (id: string) => any, private coinlibPayment: AnyPayments<any>, private walletIndex: number) {
        super();
    }

    public async fromNew(obj: IFromNew): Promise<this> {
        const { address } = await this.coinlibPayment.getPayport(this.walletIndex);
        await this.initInDatabase({
            ...obj,
            publicKey: address,
        });
        return this;
    }

    public async fromPaymentId(paymentId: string): Promise<this> {
        const { db } = await mongoGenerator();
        const existingTransaction = await db.collection('payments').findOne({ _id: new ObjectId(paymentId) });
        this.fromManual({
            ...(existingTransaction as any),
            id: paymentId,
        });
        return this;
    }

    // This always gets called from the three `from` constructors
    public fromManual(initObj: CoinlibPayment): this {
        this.setFromObject(initObj);
        this._initialized = true;
        return this;
    }

    public getDetails(): CoinlibPayment {
        return {
            amount: this.amount,
            createdAt: this.createdAt,
            expiresAt: this.expiresAt,
            id: this.id,
            publicKey: this.publicKey,
            status: this.status,
            updatedAt: this.updatedAt,
            invoiceCallbackUrl: this.invoiceCallbackUrl,
            ipnCallbackUrl: this.ipnCallbackUrl,
            payoutTransactionHash: this.payoutTransactionHash,
            currency: this.currency,
            amountPaid: this.amountPaid,
            type: this.type,
            walletIndex: this.walletIndex,
        };
    }

    protected async _cashOut() {
        const unsignedTx = await this.coinlibPayment.createSweepTransaction(this.walletIndex, config.getTyped(this.currency).ADMIN_PUBLIC_KEY);
        try {
            const signedTx = await this.coinlibPayment.signTransaction(unsignedTx);
            const { id: txHash } = await this.coinlibPayment.broadcastTransaction(signedTx);
            return txHash;
        } catch (error) {
            throw new Error(error);
        }
    }

    protected async _getBalance(): Promise<number> {
        const { confirmedBalance } = await this.coinlibPayment.getBalance(this.walletIndex);
        return +confirmedBalance;
    }
}
