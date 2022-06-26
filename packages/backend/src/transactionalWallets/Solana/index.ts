import GenericTransactionalWallet from '../GenericTransactionalWallet'
import { Keypair } from '@solana/web3.js'
import { AvailableCoins, AvailableCurrencies } from '@snow/common/src'
import base58 from 'bs58'
import { IFromNew } from '../../types'

export default class TransactionalSolana extends GenericTransactionalWallet {
    public currency: AvailableCurrencies = 'sol'
    public coinName: AvailableCoins = 'Solana'

    async fromNew(obj: IFromNew) {
        const newKeypair = Keypair.generate()
        return await this._initInDatabase({
            ...obj,
            publicKey: newKeypair.publicKey.toString(),
            privateKey: base58.encode(newKeypair.secretKey),
        })
    }
}
