import { CoinlibPayment, IFromNew, CoinlibPaymentConstructor } from '../../types';
import config from '../../config';
import { AnyPayments } from 'coinlib-port';
import GenericTransactionalWallet from '../GenericTransactionalWallet';
import context from '../../context';

export default class GenericCoinlibWrapper extends GenericTransactionalWallet {
    protected type = 'coinlib' as const;
    private coinlibPayment: AnyPayments<any>;
    private walletIndex: number;

    protected construct(constructor: CoinlibPaymentConstructor): void {
        this.coinlibPayment = context.coinlibCurrencyToClient[constructor.currency];
        this.setFromObject(constructor);
    }

    public async fromNew(obj: IFromNew, constructor: CoinlibPaymentConstructor) {
        this.construct(constructor);
        const { address } = await this.coinlibPayment.getPayport(this.walletIndex);
        const mongoPayment = await this.initInDatabase({
            ...obj,
            publicKey: address,
            walletIndex: this.walletIndex
        });
        return this.fromManual(mongoPayment);
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
