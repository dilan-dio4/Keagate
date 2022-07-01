import { Connection, clusterApiUrl, PublicKey, Keypair, Transaction, SystemProgram, LAMPORTS_PER_SOL, sendAndConfirmTransaction } from '@solana/web3.js';
import GenericNativeAdminWallet from '../GenericNativeAdminWallet';
import base58 from 'bs58';
import { availableNativeCurrencies } from '@keagate/common/src';
import config from '../../../config';
import { NativeAdminConstructor } from '../../GenericAdminWallet';
import sample from 'lodash.sample';
import limiters from '../../../limiters';

export default class AdminSolana extends GenericNativeAdminWallet {
    private connection: Connection;
    public currency: typeof availableNativeCurrencies[number] = 'SOL';
    static TRANSFER_FEE_LAMPORTS = 5000;

    constructor(constructor: NativeAdminConstructor) {
        super(constructor);
        this.connection = new Connection(this.getRandomRPC(), 'confirmed');
    }

    private getRandomRPC() {
        if (config.getTyped('TESTNETS')) {
            return sample([clusterApiUrl('devnet'), 'https://rpc.ankr.com/solana_devnet']);
        } else {
            return sample([clusterApiUrl('mainnet-beta'), 'https://rpc.ankr.com/solana']);
        }
    }

    async getBalance() {
        const balance = await limiters[this.currency].schedule(() => this.connection.getBalance(new PublicKey(this.publicKey), 'confirmed'));

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

        const latestBlockhash = await limiters[this.currency].schedule(() => this.connection.getLatestBlockhash('confirmed'));

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
            const signature = await limiters[this.currency].schedule(() => sendAndConfirmTransaction(this.connection, transaction, [adminKeypair]));
            return { result: signature };
        } catch (error) {
            throw new Error(error);
        }
    }
}
