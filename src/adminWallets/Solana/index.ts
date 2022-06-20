import { Connection, clusterApiUrl, PublicKey, Keypair, Transaction, SystemProgram, LAMPORTS_PER_SOL, sendAndConfirmTransaction } from '@solana/web3.js';
import GenericWallet from "../GenericWallet";
import base58 from "bs58";
import { AvailableCoins, AvailableTickers } from "../../currencies";

export default class Solana extends GenericWallet {
    private connection: Connection;
    public ticker: AvailableTickers = "sol";
    public coinName: AvailableCoins = "Solana";

    constructor(...args: ConstructorParameters<typeof GenericWallet>) {
        super(...args);
        this.connection = new Connection(clusterApiUrl("mainnet-beta"), "confirmed");
    }

    async getBalance() {
        const balance = await this.connection.getBalance(new PublicKey(this.publicKey), "confirmed")

        return { 
            result: {
                confirmedBalance: balance / LAMPORTS_PER_SOL,
                unconfirmedBalance: null
            }
        };
    }

    async sendTransaction(destination: string, amount: number) {
        if (!this.isValidAddress(destination)) {
            throw new Error("Invalid destination address");
        }

        const latestBlockhash = await this.connection.getLatestBlockhash('confirmed');

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