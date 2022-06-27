import GenericTransactionalWallet from '../GenericNativeTransactionalWallet';
import { AvailableCoins, AvailableCurrencies } from '@snow/common/src';
import { IFromNew, NativePaymentConstructor } from '../../../types';
import { PrivateKey } from '@dashevo/dashcore-lib';

export default class TransactionalDash extends GenericTransactionalWallet {
    public currency: AvailableCurrencies = 'DASH';
    public coinName: AvailableCoins = 'Dash';

    async fromNew(obj: IFromNew, constructor: NativePaymentConstructor) {
        this.construct(constructor);
        // https://github.com/dashevo/dashcore-lib/blob/master/docs/usage/privatekey.md
        const newKeypair = PrivateKey.fromRandom();
        const privateKey = newKeypair.toString();

        // https://github.com/dashevo/dashcore-lib/blob/master/docs/usage/publickey.md
        const publicKey = newKeypair.toPublicKey().toAddress('livenet').toString();
        return await this.initInDatabase({
            ...obj,
            publicKey,
            privateKey,
        });
    }
}
