"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const GenericWallet_1 = __importDefault(require("../GenericWallet"));
const web3_js_1 = require("@solana/web3.js");
const bs58_1 = __importDefault(require("bs58"));
class SolanaTransactional extends GenericWallet_1.default {
    constructor(...args) {
        super(...args);
        this.ticker = "sol";
        this.coinName = "Solana";
        this.connection = new web3_js_1.Connection((0, web3_js_1.clusterApiUrl)(process.env.TESTNETS ? "devnet" : "mainnet-beta"), "confirmed");
    }
    async fromNew(amount, callbackUrl) {
        const newKeypair = web3_js_1.Keypair.generate();
        return await this._initInDatabase(newKeypair.publicKey.toString(), bs58_1.default.encode(newKeypair.secretKey), amount, callbackUrl);
    }
    async getBalance() {
        const balance = await this.connection.getBalance(new web3_js_1.PublicKey(this.publicKey), "confirmed");
        return {
            result: {
                confirmedBalance: balance / web3_js_1.LAMPORTS_PER_SOL,
                unconfirmedBalance: undefined
            }
        };
    }
    async _cashOut(balance) {
        const [latestBlockhash] = await Promise.all([
            this.connection.getLatestBlockhash('confirmed'),
            this._updateStatus("SENDING")
        ]);
        const adminKeypair = web3_js_1.Keypair.fromSecretKey(bs58_1.default.decode(this.privateKey));
        const transaction = new web3_js_1.Transaction().add(web3_js_1.SystemProgram.transfer({
            fromPubkey: adminKeypair.publicKey,
            toPubkey: new web3_js_1.PublicKey(process.env.ADMIN_SOL_PUBLIC_KEY),
            lamports: Math.round(balance * web3_js_1.LAMPORTS_PER_SOL) - SolanaTransactional.TRANSFER_FEE_LAMPORTS,
        }));
        transaction.recentBlockhash = latestBlockhash.blockhash;
        transaction.feePayer = adminKeypair.publicKey;
        try {
            const signature = await (0, web3_js_1.sendAndConfirmTransaction)(this.connection, transaction, [adminKeypair]);
            this.payoutTransactionHash = signature;
            this._updateStatus("FINISHED");
            this.onDie(this.id);
        }
        catch (error) {
            this._updateStatus("FAILED", JSON.stringify(error));
            this.onDie(this.id);
        }
    }
}
exports.default = SolanaTransactional;
SolanaTransactional.TRANSFER_FEE_LAMPORTS = 5000;
//# sourceMappingURL=index.js.map