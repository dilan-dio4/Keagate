import GenericTransactionalWallet from '../GenericNativeTransactionalWallet';
import { AvailableCurrencies } from '@keagate/common/src';
import { IFromNew } from '../../../types';
import { PrivateKey } from '@dashevo/dashcore-lib';
import { NativePaymentConstructor } from '../../GenericTransactionalWallet';

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

        this.adminWalletMask = new constructor.adminWalletClass({
            publicKey,
            privateKey,
            apiProvider: constructor.apiProvider,
        });
        return this.fromManual(mongoPayment);
    }
}
