import GenericTransactionalWallet from '../GenericNativeTransactionalWallet';
import { Keypair } from '@solana/web3.js';
import { AvailableCurrencies } from '@snow/common/src';
import base58 from 'bs58';
import { IFromNew, NativePaymentConstructor } from '../../../types';

export default class TransactionalSolana extends GenericTransactionalWallet {
    public currency: AvailableCurrencies = 'SOL';

    async fromNew(obj: IFromNew, constructor: NativePaymentConstructor) {
        this.construct(constructor);

        const newKeypair = Keypair.generate();
        const mongoPayment = await this.initInDatabase({
            ...obj,
            publicKey: newKeypair.publicKey.toString(),
            privateKey: base58.encode(newKeypair.secretKey),
        });
        return this.fromManual(mongoPayment);
    }
}
