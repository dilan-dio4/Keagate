import GenericTransactionalWallet from '../GenericTransactionalWallet';
import { AvailableCoins, AvailableCurrencies, fGet } from "@snow/common/src";
import base58 from "bs58";
import { IFromNew } from "../../types";
import config from "../../config";
import { Transaction, PrivateKey } from '@dashevo/dashcore-lib';

export default class TransactionalDash extends GenericTransactionalWallet {
    public currency: AvailableCurrencies = "dash";
    public coinName: AvailableCoins = "Dash";
    // static TRANSFER_FEE_LAMPORTS = 5000;


    async fromNew(obj: IFromNew) {
        // https://github.com/dashevo/dashcore-lib/blob/master/docs/usage/privatekey.md
        const newKeypair = PrivateKey.fromRandom();
        const privateKey = newKeypair.toString();

        // https://github.com/dashevo/dashcore-lib/blob/master/docs/usage/publickey.md
        const publicKey = newKeypair.toPublicKey().toString();

        return await this._initInDatabase({
            ...obj,
            publicKey,
            privateKey
        });
    }

    async getBalance() {
        if (config.getTyped('USE_SO_CHAIN')) {
            const { data: { confirmed_balance, unconfirmed_balance } } = await fGet(`https://chain.so/api/v2/get_address_balance/DASH/${this.publicKey}`);
            return {
                result: {
                    confirmedBalance: +confirmed_balance,
                    unconfirmedBalance: +unconfirmed_balance
                }
            };
        } else {
            return await this.apiProvider.getBalance(this.currency, this.publicKey);
        }
    }

    protected async _cashOut(balance: number) {
        const [latestBlockhash] = await Promise.all([
            this.connection.getLatestBlockhash('confirmed'),
            this._updateStatus({ status: "SENDING" })
        ])

        const adminKeypair = Keypair.fromSecretKey(base58.decode(this.privateKey));

        const transaction = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: adminKeypair.publicKey,
                toPubkey: new PublicKey(config.getTyped('sol').ADMIN_PUBLIC_KEY),
                lamports: Math.round(balance * LAMPORTS_PER_SOL) - TransactionalSolana.TRANSFER_FEE_LAMPORTS,
            })
        );

        transaction.recentBlockhash = latestBlockhash.blockhash;
        transaction.feePayer = adminKeypair.publicKey;

        try {
            const signature = await sendAndConfirmTransaction(this.connection, transaction, [adminKeypair]);
            this._updateStatus({ status: "FINISHED", payoutTransactionHash: signature });
            this.onDie(this.id);
        } catch (error) {
            this._updateStatus({ status: "FAILED" }, JSON.stringify(error));
            this.onDie(this.id);
        }
    }
}