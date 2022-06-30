import { MongoPayment, NativePayment } from '../../types';
import config from '../../config';
import GenericAdminWallet from '../../adminWallets/GenericAdminWallet';
import GenericTransactionalWallet, { NativePaymentConstructor } from '../GenericTransactionalWallet';

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
                apiProvider: constructor.apiProvider
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
        };
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
