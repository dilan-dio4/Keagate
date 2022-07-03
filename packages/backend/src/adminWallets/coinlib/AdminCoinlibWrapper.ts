import GenericAdminWallet, { CoinlibAdminConstructor } from '../GenericAdminWallet';
import { AnyPayments, CoinPayments, NetworkType, BaseUnsignedTransaction, BaseSignedTransaction, BaseBroadcastResult, BalanceResult } from 'coinlib-port';
import config from '../../config';
import { delay, requestRetry, deadLogger } from '../../utils';

export default class AdminCoinlibWrapper extends GenericAdminWallet {
    private coinlibMask: AnyPayments<any>;
    private _initialized = false;

    constructor(constructor: CoinlibAdminConstructor) {
        super(constructor);
        this.coinlibMask = CoinPayments.getFactory(this.currency as any).newPayments({
            network: config.getTyped('TESTNETS') ? NetworkType.Testnet : NetworkType.Mainnet,
            addressType: 'p2pkh',
            keyPairs: [this.privateKey],
            /** logger: deadLogger, */
        } as any);

        this.coinlibMask.init().then((_) => (this._initialized = true));
    }

    public async sendTransaction(destination: string, amount: number): Promise<{ result: string }> {
        while (!this._initialized) {
            await delay(1000);
        }

        const createTx = await requestRetry<BaseUnsignedTransaction>(() => this.coinlibMask.createTransaction(0, destination, '' + amount));
        const signedTx = await requestRetry<BaseSignedTransaction>(() => this.coinlibMask.signTransaction(createTx));
        const { id: txHash } = await requestRetry<BaseBroadcastResult>(() => this.coinlibMask.broadcastTransaction(signedTx));
        return { result: txHash };
    }

    public async getBalance(): Promise<{ result: { confirmedBalance: number; unconfirmedBalance?: number } }> {
        while (!this._initialized) {
            await delay(1000);
        }

        const { confirmedBalance, unconfirmedBalance } = await requestRetry<BalanceResult>(() => this.coinlibMask.getBalance(0));
        return {
            result: {
                confirmedBalance: +confirmedBalance,
                unconfirmedBalance: +unconfirmedBalance,
            },
        };
    }
}
