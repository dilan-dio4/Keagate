import { GenericWallet } from "../../Wallet";
import { fGet, fPost } from "../../fetch";
import * as walletManager from './walletManager';
import { BlockFrostAPI, BlockfrostServerError } from '@blockfrost/blockfrost-js';
import { Responses } from '@blockfrost/blockfrost-js';

export type UTXO = Responses['address_utxo_content'];

const SATOSHIS_PER_ADA = 1E6;

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

        const client = new BlockFrostAPI({
            projectId: process.env['BLOCKFROST_API_KEY']
        });

        const fee = 600000;
        const amountToTransfer = 2000000; //2ADA
        const currentAmount = 997400000;
        const ownerAddress = walletManager.getBaseAddress().to_address().to_bech32();
        console.log(`owner address: ${ownerAddress}`);
        console.log(`pub key bech32 ${walletManager.getPublicKey().to_bech32()}`);
        console.log(`UTXO hash ${walletManager.getUtxoPublicKey().to_bech32()}`);
        console.log(`UTXO priv key bech32 ${walletManager.getUtxoPrivateKey().to_bech32()}`);


        // Retrieve utxo for the address
        let utxo: UTXO = [];
        try {
            utxo = await client.addressesUtxosAll(walletManager.getPublicKey().to_bech32());
        } catch (error) {
            if (error instanceof BlockfrostServerError && error.status_code === 404) {
                // Address derived from the seed was not used yet
                // In this case Blockfrost API will return 404
                utxo = [];
            } else {
                throw error;
            }
        }

        if (utxo.length === 0) {
            console.log();
            console.log(`You should send ADA to ${walletManager.getPublicKey().to_bech32()} to have enough funds to sent a transaction`);
            console.log();
        }
        console.log(utxo)
        return { result: JSON.stringify(utxo) }


        // try {
        //     const res = await fPost(`https://api-us-west1.tatum.io/v3/ada/transaction`, {
        //         changeAddress: this.privateKey,
        //         fee: '1',
        //         fromAddress: [
        //             {
        //                 address: this.publicKey,
        //                 privateKey: this.privateKey
        //             }
        //         ],
        //         to: [
        //             {
        //                 address: destination,
        //                 value: amount
        //             }
        //         ]
        //     }, {
        //         'Content-Type': 'application/json',
        //         'x-api-key': process.env['TATUM_API_KEY']
        //     });
        //     console.log(res)
        //     return { result: res.txId };
        // } catch (error) {
        //     throw new Error(error);
        // }
    }
}