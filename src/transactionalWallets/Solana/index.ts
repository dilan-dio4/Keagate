import GenericWallet from '../GenericWallet';
import { Connection, clusterApiUrl, PublicKey, Keypair, Transaction, SystemProgram, LAMPORTS_PER_SOL, sendAndConfirmTransaction } from '@solana/web3.js';
import dayjs from "dayjs";
import { AvailableCoins, AvailableTickers } from "../../currencies";

export default class SolanaTransactional extends GenericWallet {
    private connection: Connection;
    public ticker: AvailableTickers = "sol";
    public coinName: AvailableCoins = "Solana";
    
    constructor(...args: ConstructorParameters<typeof GenericWallet>) {
        super(...args);
        this.connection = new Connection(clusterApiUrl(process.env.TESTNETS ? "devnet" : "mainnet-beta"), "confirmed");
    }

    async fromNew(amount: number, callbackUrl?: string) {
        const newKeypair = Keypair.generate();
        return await this._initInDatabase(newKeypair.publicKey.toBytes(), newKeypair.secretKey, amount, callbackUrl);
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

    async checkTransaction() {
        if (dayjs().isAfter(dayjs(this.expiresAt))) {
            this._updateStatus("EXPIRED");
            this.onDie(this.id);
            return;
        }
        const { result: { confirmedBalance } } = await this.getBalance();
        if (confirmedBalance >= (this.amount * (1 - +process.env.TRANSACTION_SLIPPAGE_TOLERANCE))) {
            this._updateStatus("CONFIRMED");
            this._cashOut(confirmedBalance);
        } else if (confirmedBalance > 0) {
            this._updateStatus("PARTIALLY_PAID");
        }
    }

    private async _cashOut(balance: number) {
        const [latestBlockhash] = await Promise.all([
            this.connection.getLatestBlockhash('confirmed'),
            this._updateStatus("SENDING")
        ])

        const adminKeypair = Keypair.fromSecretKey(this.privateKey);

        const transaction = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: adminKeypair.publicKey,
                toPubkey: new PublicKey(process.env.SOL_PUBLIC_KEY),
                lamports: Math.round(balance * LAMPORTS_PER_SOL),
            })
        );

        transaction.recentBlockhash = latestBlockhash.blockhash;
        transaction.feePayer = adminKeypair.publicKey;

        try {
            const signature = await sendAndConfirmTransaction(this.connection, transaction, [adminKeypair]);
            this.payoutTransactionHash = signature;
            this._updateStatus("FINISHED");
            this.onDie(this.id);
        } catch (error) {
            this._updateStatus("FAILED", JSON.stringify(error));
            this.onDie(this.id);
        }
    }
}