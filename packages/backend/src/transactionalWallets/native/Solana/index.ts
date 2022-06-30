import GenericTransactionalWallet from '../GenericNativeTransactionalWallet';
import { Keypair } from '@solana/web3.js';
import { AvailableCurrencies } from '@keagate/common/src';
import base58 from 'bs58';
import { IFromNew, NativePaymentConstructor } from '../../../types';

export default class TransactionalSolana extends GenericTransactionalWallet {
    public currency: AvailableCurrencies = 'SOL';

    async fromNew(obj: IFromNew, constructor: NativePaymentConstructor) {
        this.construct(constructor);

        const newKeypair = Keypair.generate();
        const privateKey = base58.encode(newKeypair.secretKey);
        const publicKey = newKeypair.publicKey.toString();
        const mongoPayment = await this.initInDatabase({
            ...obj,
            publicKey,
            privateKey,
        });

        // This has to come after the above
        this.adminWalletMask = new constructor.adminWalletClass(publicKey, privateKey, constructor.apiProvider);
        return this.fromManual(mongoPayment);
    }
}
