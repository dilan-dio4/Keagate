import { MongoPayment, NativePayment } from '../../types';
import config from '../../config';
import GenericAdminWallet from '../../adminWallets/GenericAdminWallet';
import GenericTransactionalWallet, { NativePaymentConstructor } from '../GenericTransactionalWallet';
import { PaymentStatusType } from '@keagate/common/src';
import dayjs from 'dayjs';

export default abstract class GenericNativeTransactionalWallet extends GenericTransactionalWallet {
    protected privateKey: string;
    protected adminWalletMask: GenericAdminWallet;
    protected type = 'native' as const;

    public fromManual(initObj: MongoPayment, constructor?: NativePaymentConstructor) {
        this.setFromObject(initObj);
        if (constructor) {
            // Direct instantiation --
            this.adminWalletMask = new constructor.adminWalletClass({
                publicKey: this.publicKey,
                privateKey: this.privateKey,
            });
            this.construct(constructor);
            // --
        }
        this._initialized = true;
        return this;
    }

    public getDetails(): NativePayment {
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
            privateKey: this.privateKey,
            extraId: this.extraId
        };
    }

    public async checkTransaction(statusCallback: (status: PaymentStatusType) => any = (status: PaymentStatusType) => null) {
        if (this.status === "CONFIRMED" || this.status === "SENDING") {
            statusCallback(this.status);
            return;
        }

        if (!this._initialized) {
            statusCallback('WAITING');
            return;
        }
        
        const confirmedBalance = await this._getBalance();

        // Follow this flow...
        if (confirmedBalance >= this.amount * (1 - config.getTyped('TRANSACTION_SLIPPAGE_TOLERANCE'))) {
            this.status = "SENDING"
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

    protected async _getBalance(): Promise<number> {
        const {
            result: { confirmedBalance },
        } = await this.adminWalletMask.getBalance();
        return confirmedBalance;
    }

    protected async _cashOut(balance: number) {
        try {
            const { result } = await this.adminWalletMask.sendTransaction(config.getTyped(this.currency).ADMIN_PUBLIC_KEY, balance);
            return result;
        } catch (error) {
            throw new Error(error);
        }
    }
}
