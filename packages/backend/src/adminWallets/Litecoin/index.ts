import GenericAdminWallet from "../GenericAdminWallet";
import { Transaction } from 'bitcore-lib-ltc';
import { AvailableCoins, AvailableTickers, fGet, fPost, convertChainsoToNativeUtxo } from "@snow/common/src";
import config from "../../config";

export default class AdminLitecoin extends GenericAdminWallet {
    private mediumGasFee: number;
    public ticker: AvailableTickers = "ltc";
    public coinName: AvailableCoins = "Litecoin";
    
    constructor(...args: ConstructorParameters<typeof GenericAdminWallet>) {
        super(...args);
        fGet('https://api.blockcypher.com/v1/ltc/main')
            .then(({ medium_fee_per_kb }) => this.mediumGasFee = medium_fee_per_kb)
    }

    async getBalance() {
        if (config.getTyped('USE_SO_CHAIN')) {
            const { data: { confirmed_balance, unconfirmed_balance } } = await fGet(`https://chain.so/api/v2/get_address_balance/LTC/${this.publicKey}`);
            return {
                result: {
                    confirmedBalance: +confirmed_balance,
                    unconfirmedBalance: +unconfirmed_balance
                }
            };
        } else {
            return await this.apiProvider.getBalance(this.ticker, this.publicKey);
        }
    }

    async sendTransaction(destination: string, amount: number) {
        if (!this.isValidAddress(destination)) {
            throw new Error("Invalid destination address");
        }

        if (!this.mediumGasFee) {
            throw new Error("Gathering gas fees");
        }

        const { data: { txs } } = await fGet(`https://chain.so/api/v2/get_tx_unspent/LTC/${this.publicKey}`); // TODO API-providers

        let totalBalance = 0;
        for (const currUtxo of txs) {
            totalBalance += +currUtxo.value;
        }

        if (totalBalance < amount) {
            throw new Error("Insufficient funds");
        }

        const totalBalanceInSatoshis = Math.round(totalBalance * 1E8);
        const transactionValInSatoshis = Math.round(amount * 1E8);

        const ltcTransaction: Transaction = new Transaction()
            .from(convertChainsoToNativeUtxo(txs, this.publicKey))
            .to(destination, transactionValInSatoshis - this.mediumGasFee)
            .to(this.publicKey, totalBalanceInSatoshis - transactionValInSatoshis)
            .change(this.publicKey)
            .sign(this.privateKey);


        return await this.apiProvider.sendTransaction(this.ticker, ltcTransaction.uncheckedSerialize());

        // https://bitcoincore.org/en/doc/0.19.0/rpc/rawtransactions/sendrawtransaction/
        // try {
        //     const { result } = await fPost('https://ltc.nownodes.io', {
        //         "jsonrpc": "2.0",
        //         "method": "sendrawtransaction",
        //         "params": [
        //             ltcTransaction.uncheckedSerialize()
        //         ],
        //         "id": "test",
        //         "API_key": "f994ff7a-12b4-405a-b214-941ab2df13ce"
        //     }, {
        //         'Content-Type': 'application/json'
        //     })
        //     return { result };
        // } catch (error) {
        //     console.error(error);
        // }
    }
}