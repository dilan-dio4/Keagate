import { NativePaymentConstructor } from '../../GenericTransactionalWallet';
import GenericTransactionalWallet from '../GenericNativeTransactionalWallet';
import { AvailableCurrencies } from '@keagate/common';
import { IFromNew } from '../../../types';
import { ethers } from 'ethers';

export default class TransactionalPolygon extends GenericTransactionalWallet {
    public currency: AvailableCurrencies = 'MATIC';

    async fromNew(obj: IFromNew, constructor: NativePaymentConstructor) {
        this.construct(constructor);

        const newKeypair = ethers.Wallet.createRandom();
        const publicKey = newKeypair.address;
        const privateKey = newKeypair._signingKey().privateKey;

        const mongoPayment = await this.initInDatabase({
            ...obj,
            publicKey,
            privateKey,
        });

        this.adminWalletMask = new constructor.adminWalletClass({
            publicKey,
            privateKey,
        });
        return this.fromManual(mongoPayment);
    }
}
