import { Connection, clusterApiUrl, PublicKey, Keypair, Transaction, SystemProgram, LAMPORTS_PER_SOL, sendAndConfirmTransaction } from '@solana/web3.js';
import { GenericWallet } from "../../Wallet";
import base58 from "bs58";

export default class Solana extends GenericWallet {
    private connection: Connection;

    constructor(...args: ConstructorParameters<typeof GenericWallet>) {
        super(...args);
        this.connection = new Connection(clusterApiUrl("mainnet-beta"), "confirmed");
    }

    async getBalance() {
        const balance = await this.connection.getBalance(new PublicKey(this.publicKey), "finalized")

        return { result: balance / LAMPORTS_PER_SOL };
    }

    async sendTransaction(destination: string, amount: number) {
        if (!this.isValidAddress(destination)) {
            throw new Error("Invalid destination address");
        }

        const latestBlockhash = await this.connection.getLatestBlockhash('finalized');

        const adminKeypair = Keypair.fromSecretKey(base58.decode(this.privateKey));

        const transaction = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: adminKeypair.publicKey,
                toPubkey: new PublicKey(destination),
                lamports: Math.round(amount * LAMPORTS_PER_SOL),
            })
        );

        transaction.recentBlockhash = latestBlockhash.blockhash;
        transaction.feePayer = adminKeypair.publicKey;

        try {
            const signature = await sendAndConfirmTransaction(this.connection, transaction, [adminKeypair]);
            return { result: signature };   
        } catch (error) {
            throw new Error(error);
        }
    }
}