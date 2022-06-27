import { NativePayment, NativePaymentConstructor } from '../../types';
import config from '../../config';
import GenericAdminWallet from '../../adminWallets/GenericAdminWallet';
import GenericTransactionalWallet from '../GenericTransactionalWallet';

export default abstract class GenericNativeTransactionalWallet extends GenericTransactionalWallet {
    protected privateKey: string;
    protected adminWalletMask: GenericAdminWallet;
    protected type = 'native' as const;

    protected construct(constructor: NativePaymentConstructor): void {
        this.setFromObject(constructor);
        this.adminWalletMask = new constructor.adminWalletClass(this.publicKey, this.privateKey, constructor.apiProvider);
        // this.getBalance = adminWalletMask.getBalance;
        // this.sendTransaction = adminWalletMask.sendTransaction;
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
