import { ConcreteConstructor } from '@snow/common/src'
import mongoGenerator from '../../mongoGenerator'
import { NativePayment } from '../../types'
import config from '../../config'
import { GenericProvider } from '@snow/api-providers/src'
import GenericAdminWallet from '../../adminWallets/GenericAdminWallet'
import GenericTransactionalWallet from "../GenericTransactionalWallet"
import { ObjectId } from "mongodb"

export default abstract class GenericNativeTransactionalWallet extends GenericTransactionalWallet {
    protected privateKey: string
    protected adminWalletMask: GenericAdminWallet
    protected type = "native" as const

    constructor(
        protected onDie: (id: string) => any,
        protected apiProvider: GenericProvider,
        protected adminWalletClass: ConcreteConstructor<typeof GenericAdminWallet>,
    ) {
        super();
    }

    // public async fromPublicKey(publicKey: string | Uint8Array): Promise<this> {
    //     const { db } = await mongoGenerator()
    //     const existingTransaction = await db.collection('transactions').findOne({ publicKey })
    //     if (existingTransaction) {
    //         this.fromManual({
    //             ...(existingTransaction as any),
    //             id: existingTransaction._id.toString(),
    //         })
    //         return this
    //     } else {
    //         throw new Error('No transaction with the corresponding public key found')
    //     }
    // }

    public async fromPaymentId(paymentId: string): Promise<this> {
        const { db } = await mongoGenerator()
        const existingTransaction = await db.collection('transactions').findOne({ _id: new ObjectId(paymentId) })
        this.fromManual({
            ...(existingTransaction as any),
            id: paymentId,
        })
        return this
    }

    // This always gets called from the three `from` constructors
    public fromManual(initObj: NativePayment): this {
        this.setFromObject(initObj)
        this.adminWalletMask = new this.adminWalletClass(this.publicKey, this.privateKey, this.apiProvider)
        // this.getBalance = adminWalletMask.getBalance;
        // this.sendTransaction = adminWalletMask.sendTransaction;
        this._initialized = true
        return this
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
            privateKey: this.privateKey
        }
    }

    protected async _getBalance(): Promise<number> {
        const { result: { confirmedBalance } } = await this.adminWalletMask.getBalance();
        return confirmedBalance;
    }

    protected async _cashOut(balance: number) {
        try {
            const { result } = await this.adminWalletMask.sendTransaction(config.getTyped(this.currency).ADMIN_PUBLIC_KEY, balance);
            return result;
        } catch (error) {
            throw new Error(error)
        }
    }
}
