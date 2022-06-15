import { GenericWallet } from "../../Wallet";
import { fGet, fPost } from "../../fetch";

const SATOSHIS_PER_ADA = 1E6;

// https://jestersimpps.github.io/my-first-experience-with-bitpay-bitcore/
export default class Cardano extends GenericWallet {
    async getBalance() {
        const txs = await fGet(`https://api-us-west1.tatum.io/v3/ada/${this.publicKey}/utxos`, {
            "x-api-key": process.env['TATUM_API_KEY']
        });

        let totalBalanceInSatoshis = 0;
        for (const currUtxo of txs as any[]) {
            totalBalanceInSatoshis += +currUtxo.value;
        }

        return { result: totalBalanceInSatoshis / SATOSHIS_PER_ADA };
    }

    async sendTransaction(destination: string, amount: number) {
        if (!this.isValidAddress(destination)) {
            throw new Error("Invalid destination address");
        }


        const { result: currBalance } = await this.getBalance();
        if (currBalance < amount) {
            throw new Error("Insufficient funds");
        }

        const { txId: result } = await fPost(`https://api-us-west1.tatum.io/v3/ada/transaction`, {
            changeAddress: this.publicKey,
            fee: '0.17',
            fromAddress: [
                {
                    address: this.publicKey,
                    privateKey: this.privateKey
                }
            ],
            to: [
                {
                    address: '2MzNGwuKvMEvKMQogtgzSqJcH2UW3Tc5oc7',
                    value: amount
                }
            ]
        }, {
            'Content-Type': 'application/json',
            'x-api-key': process.env['TATUM_API_KEY']
        });

        return { result };
    }
}