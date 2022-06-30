import GenericAdminWallet, { CoinlibAdminConstructor } from '../GenericAdminWallet';
import { AnyPayments, CoinPayments, NetworkType } from 'coinlib-port';
import config from '../../config';
import { delay } from '../../utils';
import { availableCoinlibCurrencies } from 'packages/common/build/currencies';

export default class AdminCoinlibWrapper extends GenericAdminWallet {
    private coinlibMask: AnyPayments<any>;
    private _initialized = false;
    private currency: typeof availableCoinlibCurrencies[number];

    constructor(constuctor: CoinlibAdminConstructor) {
        super(constuctor);
        this.coinlibMask = CoinPayments.getFactory(this.currency as any).newPayments({ // TODO: drop any
            network: config.getTyped('TESTNETS') ? NetworkType.Testnet : NetworkType.Mainnet,
            addressType: 'p2pkh',
            keyPairs: [
                this.privateKey
            ]
        } as any)

        this.coinlibMask.init()
            .then(_ => this._initialized = true)
    }

    public async sendTransaction(destination: string, amount: number): Promise<{ result: string; }> {
        while (!this._initialized) {
            await delay(1000);
        }

        const createTx = await this.coinlibMask.createTransaction(0, destination, "" + amount);
        const signedTx = await this.coinlibMask.signTransaction(createTx);
        const { id: txHash } = await this.coinlibMask.broadcastTransaction(signedTx);
        return { result: txHash };
    }

    public async getBalance(): Promise<{ result: { confirmedBalance: number; unconfirmedBalance?: number; }; }> {
        while (!this._initialized) {
            await delay(1000);
        }

        const { confirmedBalance, unconfirmedBalance } = await this.coinlibMask.getBalance(0);
        return {
            result: {
                confirmedBalance: +confirmedBalance,
                unconfirmedBalance: +unconfirmedBalance
            }
        }
    }

}
