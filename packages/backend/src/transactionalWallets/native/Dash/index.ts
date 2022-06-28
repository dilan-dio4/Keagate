import GenericTransactionalWallet from '../GenericNativeTransactionalWallet';
import { AvailableCurrencies } from '@snow/common/src';
import { IFromNew, NativePaymentConstructor } from '../../../types';
import { PrivateKey } from '@dashevo/dashcore-lib';

export default class TransactionalDash extends GenericTransactionalWallet {
    public currency: AvailableCurrencies = 'DASH';

    async fromNew(obj: IFromNew, constructor: NativePaymentConstructor) {
        this.construct(constructor);
        // https://github.com/dashevo/dashcore-lib/blob/master/docs/usage/privatekey.md
        const newKeypair = PrivateKey.fromRandom();
        const privateKey = newKeypair.toString();

        // https://github.com/dashevo/dashcore-lib/blob/master/docs/usage/publickey.md
        const publicKey = newKeypair.toPublicKey().toAddress('livenet').toString();
        const mongoPayment = await this.initInDatabase({
            ...obj,
            publicKey,
            privateKey,
        });
        return this.fromManual(mongoPayment);
    }
}
