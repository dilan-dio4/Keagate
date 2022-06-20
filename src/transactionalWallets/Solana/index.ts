import GenericWallet from '../GenericWallet';
import { Connection, clusterApiUrl, PublicKey, Keypair, Transaction, SystemProgram, LAMPORTS_PER_SOL, sendAndConfirmTransaction } from '@solana/web3.js';
import mongoGenerator from "../../mongoGenerator";
import dayjs from "dayjs";
import fetch from 'cross-fetch';
import { PaymentStatus } from "../../types";
import { ObjectId } from "mongodb";
import { AvailableCoins, AvailableTickers } from "../../currencies";

export default class SolanaTransactional extends GenericWallet {
    private connection: Connection;
    public ticker: AvailableTickers = "sol";
    public coinName: AvailableCoins = "Solana";
    
    constructor(...args: ConstructorParameters<typeof GenericWallet>) {
        super(...args);
        this.connection = new Connection(clusterApiUrl(process.env.TESTNETS ? "devnet" : "mainnet-beta"), "confirmed");
    }

    fromNew(amount: number, callbackUrl?: string) {
        const newKeypair = Keypair.generate();
        this.publicKey = newKeypair.publicKey.toBytes();
        this.privateKey = newKeypair.secretKey;
        this.amount = amount;
        this.callbackUrl = callbackUrl;
        this.expiresAt = dayjs().add(+process.env.TRANSACTION_TIMEOUT, 'seconds').toDate();
        const now = dayjs().toDate();
        this.createdAt = now;
        this.updatedAt = now;
        this._fromGeneratedKeypair();
        return this;
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

    private async _updateStatus(status: PaymentStatus, error?: string) {
        const { db } = await mongoGenerator();
        this.updatedAt = dayjs().toDate();
        if (error) {
            db.collection('transactions').updateOne({ _id: new ObjectId(this.id) }, { $set: { status, updatedAt: this.updatedAt, error } })
        } else {
            db.collection('transactions').updateOne({ _id: new ObjectId(this.id) }, { $set: { status, updatedAt: this.updatedAt } })
        }
        if (this.callbackUrl) {
            fetch(this.callbackUrl, {
                method: "POST",
                body: JSON.stringify({
                    status,
                    paymentId: this.id,
                    currency: this.ticker,
                    createdAt: this.createdAt,
                    updatedAt: this.updatedAt,
                    expiresAt: this.expiresAt,
                    payoutTransactionHash: this.payoutTransactionHash,
                    error
                }),
                headers: {
                    /** TODO: Hmac Verification */
                }
            })
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