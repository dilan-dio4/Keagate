import { GenericWallet } from "../../Wallet";
import { fGet, fPost } from "../../fetch";
import { convertChainsoToNativeUtxo } from '../../utils';
import { Transaction } from 'bitcore-lib-ltc';

export default class Litecoin extends GenericWallet {
    async getBalance() {
        const { data: { confirmed_balance, unconfirmed_balance } } = await fGet(`https://chain.so/api/v2/get_address_balance/LTC/${this.publicKey}`);
        return {
            result: confirmed_balance
        };
    }

    async sendTransaction(destination: string, amount: number) {
        if (!this.isValidAddress(destination)) {
            throw new Error("Invalid destination address");
        }

        const { data: { txs } } = await fGet(`https://chain.so/api/v2/get_tx_unspent/LTC/${this.publicKey}`);

        let totalBalance = 0;
        for (const currUtxo of txs) {
            totalBalance += +currUtxo.value;
        }

        if (totalBalance < amount) {
            throw new Error("Insufficient funds");
        }

        const ltcTransaction: Transaction = new Transaction()
            .from(convertChainsoToNativeUtxo(txs, this.publicKey))
            .to(destination, Math.round(amount * 1E8))
            .change(this.publicKey)
            .sign(this.privateKey);


        // https://bitcoincore.org/en/doc/0.19.0/rpc/rawtransactions/sendrawtransaction/
        try {
            const res = await fPost(process.env.LTC_RPC_URL, {
                "jsonrpc": "2.0",
                "method": "sendrawtransaction",
                "params": [
                    ltcTransaction.uncheckedSerialize(),
                    0.0001
                ],
                "id": "getblock.io"
            }, {
                'Content-Type': 'application/json',
                'x-api-key': process.env.LTC_RPC_API_KEY
            })
            console.log(res);
            return { result: res.result };
        } catch (error) {
            console.error(error);
        }

    }
}