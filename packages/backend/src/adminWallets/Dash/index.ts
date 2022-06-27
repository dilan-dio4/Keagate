import GenericAdminWallet from '../GenericAdminWallet';
import { Transaction } from '@dashevo/dashcore-lib';
import { AvailableCoins, AvailableCurrencies, fGet, convertChainsoToNativeUtxo } from '@snow/common/src';
import config from '../../config';

// https://jestersimpps.github.io/my-first-experience-with-bitpay-bitcore/
// TODO custom fee like LTC
export default class AdminDash extends GenericAdminWallet {
    public currency: AvailableCurrencies = 'DASH';
    public coinName: AvailableCoins = 'Dash';
    static TRANSACTION_FEE = 1000;

    async getBalance() {
        if (config.getTyped('USE_SO_CHAIN')) {
            const {
                data: { confirmed_balance, unconfirmed_balance },
            } = await fGet(`https://chain.so/api/v2/get_address_balance/DASH/${this.publicKey}`);
            return {
                result: {
                    confirmedBalance: +confirmed_balance,
                    unconfirmedBalance: +unconfirmed_balance,
                },
            };
        } else {
            return await this.apiProvider.getBalance(this.currency, this.publicKey);
        }
    }

    async sendTransaction(destination: string, amount: number) {
        if (!this.isValidAddress(destination)) {
            throw new Error('Invalid destination address');
        }

        const {
            data: { txs },
        } = await fGet(`https://chain.so/api/v2/get_tx_unspent/DASH/${this.publicKey}`);
        let totalBalance = 0;
        for (const currUtxo of txs) {
            totalBalance += +currUtxo.value;
        }

        if (totalBalance < amount) {
            throw new Error('Insufficient funds');
        }

        const dashTransaction: Transaction = new (Transaction as any)()
            .from(convertChainsoToNativeUtxo(txs, this.publicKey, true))
            .to(destination, Math.round(amount * 1e8) - AdminDash.TRANSACTION_FEE)
            .change(this.publicKey)
            .sign(this.privateKey);

        if (dashTransaction.getSerializationError(undefined)) {
            const error = dashTransaction.getSerializationError(undefined);
            throw error;
        }

        return await this.apiProvider.sendTransaction(this.currency, dashTransaction.serialize(false));
    }
}
