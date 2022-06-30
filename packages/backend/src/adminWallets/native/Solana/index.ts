import { Connection, clusterApiUrl, PublicKey, Keypair, Transaction, SystemProgram, LAMPORTS_PER_SOL, sendAndConfirmTransaction } from '@solana/web3.js';
import GenericNativeAdminWallet from '../GenericNativeAdminWallet';
import base58 from 'bs58';
import { AvailableCurrencies } from '@keagate/common/src';
import config from '../../../config';
import { NativeAdminConstructor } from '../../GenericAdminWallet';
import { requestRetry } from '../../../utils';

export default class AdminSolana extends GenericNativeAdminWallet {
    private connection: Connection;
    public currency: AvailableCurrencies = 'SOL';
    static TRANSFER_FEE_LAMPORTS = 5000;

    constructor(constructor: NativeAdminConstructor) {
        super(constructor);
        this.connection = new Connection(clusterApiUrl(config.getTyped('TESTNETS') ? 'devnet' : 'mainnet-beta'), 'confirmed');
    }

    async getBalance() {
        const balance = await requestRetry<number>(() => this.connection.getBalance(new PublicKey(this.publicKey), 'confirmed'));

        return {
            result: {
                confirmedBalance: balance / LAMPORTS_PER_SOL,
                unconfirmedBalance: undefined,
            },
        };
    }

    async sendTransaction(destination: string, amount: number) {
        if (!this.isValidAddress(destination)) {
            throw new Error('Invalid destination address');
        }

        const latestBlockhash = await this.connection.getLatestBlockhash('confirmed');

        const adminKeypair = Keypair.fromSecretKey(base58.decode(this.privateKey));

        const transaction = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: adminKeypair.publicKey,
                toPubkey: new PublicKey(destination),
                lamports: Math.round(amount * LAMPORTS_PER_SOL) - AdminSolana.TRANSFER_FEE_LAMPORTS,
            }),
        );

        transaction.recentBlockhash = latestBlockhash.blockhash;
        transaction.feePayer = adminKeypair.publicKey;

        try {
            const signature = await requestRetry<string>(() => sendAndConfirmTransaction(this.connection, transaction, [adminKeypair]));
            return { result: signature };
        } catch (error) {
            throw new Error(error);
        }
    }
}
