import GenericTransactionalWallet from '../GenericTransactionalWallet';
import { AvailableCoins, AvailableCurrencies } from "@snow/common/src";
import { IFromNew } from "../../types";
import { PrivateKey } from '@dashevo/dashcore-lib';

export default class TransactionalDash extends GenericTransactionalWallet {
    public currency: AvailableCurrencies = "dash";
    public coinName: AvailableCoins = "Dash";

    async fromNew(obj: IFromNew) {
        // https://github.com/dashevo/dashcore-lib/blob/master/docs/usage/privatekey.md
        const newKeypair = PrivateKey.fromRandom();
        const privateKey = newKeypair.toString();

        // https://github.com/dashevo/dashcore-lib/blob/master/docs/usage/publickey.md
        const publicKey = newKeypair.toPublicKey().toString();
        return await this._initInDatabase({
            ...obj,
            publicKey,
            privateKey
        });
    }
}