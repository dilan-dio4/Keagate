import { CoinlibPayment, IFromNew, MongoPayment } from '../../types';
import config from '../../config';
import { AnyPayments, BalanceResult, BaseUnsignedTransaction, BaseSignedTransaction, BaseBroadcastResult } from 'coinlib-port';
import GenericTransactionalWallet, { CoinlibPaymentConstructor } from '../GenericTransactionalWallet';
import context from '../../context';
import { availableCoinlibCurrencies } from '@keagate/common/src';
import crypto from 'crypto';
import { requestRetry } from '../../utils';

function randU32Sync() {
    return crypto.randomBytes(4).readUInt32BE(0);
}

export const walletIndexGenerator: Record<typeof availableCoinlibCurrencies[number], () => number> = {
    LTC: randU32Sync,
    TRX: () => Math.round(randU32Sync() / 10000),
    ADA: randU32Sync,
    BTC: randU32Sync,
    DASH: randU32Sync,
    XRP: randU32Sync,
};

export default class TransactionalCoinlibWrapper extends GenericTransactionalWallet {
    protected type = 'coinlib' as const;
    private coinlibPayment: AnyPayments<any>;
    private walletIndex: number;

    public async fromNew(obj: IFromNew, constructor: CoinlibPaymentConstructor) {
        // Instantiate --
        this.construct(constructor);
        this.coinlibPayment = context.coinlibCurrencyToClient[constructor.currency];
        // --

        const { address } = await this.coinlibPayment.getPayport(this.walletIndex);
        const mongoPayment = await this.initInDatabase({
            ...obj,
            publicKey: address,
            walletIndex: this.walletIndex,
        });
        return this.fromManual(mongoPayment);
    }

    public fromManual(initObj: MongoPayment, constructor?: CoinlibPaymentConstructor) {
        this.setFromObject(initObj);
        if (constructor) {
            // Direct instantiation --
            this.coinlibPayment = context.coinlibCurrencyToClient[constructor.currency];
            this.construct(constructor);
            // --
        }
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
        const confirmedBalance = await this._getBalance();

        try {
            const createTx = await requestRetry<BaseUnsignedTransaction>(() =>
                this.coinlibPayment.createTransaction(this.walletIndex, config.getTyped(this.currency).ADMIN_PUBLIC_KEY, '' + confirmedBalance),
            );
            const signedTx = await requestRetry<BaseSignedTransaction>(() => this.coinlibPayment.signTransaction(createTx));
            const { id: txHash } = await requestRetry<BaseBroadcastResult>(() => this.coinlibPayment.broadcastTransaction(signedTx));
            return txHash;
        } catch (error) {
            throw new Error(error);
        }
    }

    protected async _getBalance(): Promise<number> {
        const { confirmedBalance } = await requestRetry<BalanceResult>(() => this.coinlibPayment.getBalance(this.walletIndex));
        return +confirmedBalance;
    }
}
