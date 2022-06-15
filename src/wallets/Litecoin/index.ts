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

        const data = await fPost('https://api-us-west1.tatum.io/v3/litecoin/transaction', {
            fromAddress: [
                {
                    address: this.publicKey,
                    privateKey: this.privateKey
                }
            ],
            to: [
                {
                    address: destination,
                    value: amount
                }
            ]
        }, {
            'Content-Type': 'application/json',
            'x-api-key': 'e49fe445-9b56-40fc-88ec-fb953ee2ee11'
        })

        console.log(data);
        return { result: JSON.stringify(data) }

        // const { data: { txs } } = await fGet(`https://chain.so/api/v2/get_tx_unspent/LTC/${this.publicKey}`);

        // let totalBalance = 0;
        // for (const currUtxo of txs) {
        //     totalBalance += +currUtxo.value;
        // }

        // if (totalBalance < amount) {
        //     throw new Error("Insufficient funds");
        // }

        // const ltcTransaction: Transaction = new Transaction()
        //     .from(convertChainsoToNativeUtxo(txs, this.publicKey))
        //     .to(destination, Math.round(amount * 1E8))
        //     .fee(0.0001)
        //     .change(this.publicKey)
        //     .sign(this.privateKey);


        // // https://bitcoincore.org/en/doc/0.19.0/rpc/rawtransactions/sendrawtransaction/
        // try {
        //     const res = await fPost('https://ltc.nownodes.io', {
        //         "jsonrpc": "2.0",
        //         "method": "sendrawtransaction",
        //         "params": [
        //             ltcTransaction.uncheckedSerialize(),
        //             1
        //         ],
        //         "id": "test",
        //         "API_key": "f994ff7a-12b4-405a-b214-941ab2df13ce"
        //     }, {
        //         'Content-Type': 'application/json'
        //     })
        //     console.log(res);
        //     return { result: res.result };
        // } catch (error) {
        //     console.error(error);
        // }

    }
}