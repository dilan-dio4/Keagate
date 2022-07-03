import { CoinlibPayment, IFromNew, MongoPayment } from '../../types';
import config from '../../config';
import { AnyPayments, BalanceResult, BaseUnsignedTransaction, BaseSignedTransaction, BaseBroadcastResult, UtxoInfo } from 'coinlib-port';
import GenericTransactionalWallet, { CoinlibPaymentConstructor } from '../GenericTransactionalWallet';
import { PaymentStatusType } from '@keagate/common/src';
import { requestRetry } from '../../utils';
import dayjs from 'dayjs';
import { minWalletBalances } from './trxLimits';

export default class TransactionalCoinlibWrapper extends GenericTransactionalWallet {
    protected type = 'coinlib' as const;
    private coinlibPayment: AnyPayments<any>;
    private walletIndex: number;
    private memo?: string;

    public async fromNew(obj: IFromNew, constructor: CoinlibPaymentConstructor) {
        // Instantiate --
        this.construct(constructor);
        // --

        // NOT THE SAME AS `extraId` from transactional payments
        const { address, extraId: memo } = await this.coinlibPayment.getPayport(this.walletIndex);
        const mongoPayment = await this.initInDatabase({
            ...obj,
            publicKey: address,
            walletIndex: this.walletIndex,
            memo,
        });
        return this.fromManual(mongoPayment);
    }

    public fromManual(initObj: MongoPayment, constructor?: CoinlibPaymentConstructor) {
        this.setFromObject(initObj);
        if (constructor) {
            // Direct instantiation --
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
            extraId: this.extraId,
            memo: this.memo,
        };
    }

    public async checkTransaction(statusCallback: (status: PaymentStatusType) => any = (status: PaymentStatusType) => null) {
        if (this.status === 'CONFIRMED' || this.status === 'SENDING') {
            statusCallback(this.status);
            return;
        }

        if (!this._initialized) {
            statusCallback('WAITING');
            return;
        }

        const { confirmedBalance: confirmedBalanceString, sweepable } = await requestRetry<BalanceResult>(() =>
            this.coinlibPayment.getBalance(this.walletIndex),
        );
        const confirmedBalance = +confirmedBalanceString;
        // Follow this flow...
        if (confirmedBalance >= this.amount * (1 - config.getTyped('TRANSACTION_SLIPPAGE_TOLERANCE')) && sweepable) {
            this.status = 'SENDING';
            await this._cashOut(confirmedBalance);
            statusCallback('CONFIRMED');
            this.updateStatus({ status: 'CONFIRMED', amountPaid: confirmedBalance });
        } else if (dayjs().isAfter(dayjs(this.expiresAt))) {
            statusCallback('EXPIRED');
            this.updateStatus({ status: 'EXPIRED' });
            if (confirmedBalance > 0) {
                await this._cashOut(confirmedBalance);
            }
            this.onDie(this.id);
        } else if (confirmedBalance > 0 && this.amountPaid !== confirmedBalance) {
            statusCallback('PARTIALLY_PAID');
            this.updateStatus({ status: 'PARTIALLY_PAID', amountPaid: confirmedBalance });
        } else {
            statusCallback('WAITING');
        }
    }

    protected async _cashOut(balance?: number) {
        try {
            let createTx: BaseUnsignedTransaction;

            if (balance && this.currency in minWalletBalances) {
                createTx = await requestRetry<BaseUnsignedTransaction>(() =>
                    this.coinlibPayment.createTransaction(
                        this.walletIndex, 
                        config.getTyped(this.currency).ADMIN_PUBLIC_KEY,
                        '' + (balance - minWalletBalances[this.currency])
                    ),
                );
            } else {
                const utxos = await requestRetry<UtxoInfo[]>(() => this.coinlibPayment.getUtxos(this.walletIndex));
                createTx = await requestRetry<BaseUnsignedTransaction>(() =>
                    this.coinlibPayment.createSweepTransaction(this.walletIndex, config.getTyped(this.currency).ADMIN_PUBLIC_KEY, {
                        availableUtxos: utxos.length > 0 ? utxos : undefined,
                    }),
                );
            }

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
