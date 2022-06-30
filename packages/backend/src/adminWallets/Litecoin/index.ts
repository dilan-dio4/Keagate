import GenericAdminWallet from '../GenericAdminWallet';
import { Transaction } from 'bitcore-lib-ltc';
import { AvailableCurrencies, fGet, convertChainsoToNativeUtxo } from '@keagate/common/src';
import config from '../../config';

export default class AdminLitecoin extends GenericAdminWallet {
    private mediumGasFee: number; // TODO: Maybe do lowest gas fee?
    public currency: AvailableCurrencies = 'LTC';

    private async _setGas() {
        const { medium_fee_per_kb } = await fGet('https://api.blockcypher.com/v1/ltc/main');
        this.mediumGasFee = medium_fee_per_kb;
    }

    async getBalance() {
        if (config.getTyped('USE_SO_CHAIN')) {
            const {
                data: { confirmed_balance, unconfirmed_balance },
            } = await fGet(`https://chain.so/api/v2/get_address_balance/LTC/${this.publicKey}`);
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

        if (!this.mediumGasFee) {
            await this._setGas();
        }

        const {
            data: { txs },
        } = await fGet(`https://chain.so/api/v2/get_tx_unspent/LTC/${this.publicKey}`); // TODO API-providers

        let totalBalance = 0;
        for (const currUtxo of txs) {
            totalBalance += +currUtxo.value;
        }

        if (totalBalance < amount) {
            throw new Error('Insufficient funds');
        }

        const totalBalanceInSatoshis = Math.round(totalBalance * 1e8);
        const transactionValInSatoshis = Math.round(amount * 1e8);

        const ltcTransaction: Transaction = new Transaction()
            .from(convertChainsoToNativeUtxo(txs, this.publicKey))
            .to(destination, transactionValInSatoshis - this.mediumGasFee)
            .to(this.publicKey, totalBalanceInSatoshis - transactionValInSatoshis)
            .change(this.publicKey)
            .sign(this.privateKey);

        return await this.apiProvider.sendTransaction(this.currency, ltcTransaction.uncheckedSerialize());
    }
}
