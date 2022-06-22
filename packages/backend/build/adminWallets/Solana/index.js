"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const web3_js_1 = require("@solana/web3.js");
const GenericAdminWallet_1 = __importDefault(require("../GenericAdminWallet"));
const bs58_1 = __importDefault(require("bs58"));
class AdminSolana extends GenericAdminWallet_1.default {
    constructor(...args) {
        super(...args);
        this.ticker = "sol";
        this.coinName = "Solana";
        this.connection = new web3_js_1.Connection((0, web3_js_1.clusterApiUrl)("mainnet-beta"), "confirmed");
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
    async sendTransaction(destination, amount) {
        if (!this.isValidAddress(destination)) {
            throw new Error("Invalid destination address");
        }
        const latestBlockhash = await this.connection.getLatestBlockhash('confirmed');
        const adminKeypair = web3_js_1.Keypair.fromSecretKey(bs58_1.default.decode(this.privateKey));
        const transaction = new web3_js_1.Transaction().add(web3_js_1.SystemProgram.transfer({
            fromPubkey: adminKeypair.publicKey,
            toPubkey: new web3_js_1.PublicKey(destination),
            lamports: Math.round(amount * web3_js_1.LAMPORTS_PER_SOL),
        }));
        transaction.recentBlockhash = latestBlockhash.blockhash;
        transaction.feePayer = adminKeypair.publicKey;
        try {
            const signature = await (0, web3_js_1.sendAndConfirmTransaction)(this.connection, transaction, [adminKeypair]);
            return { result: signature };
        }
        catch (error) {
            throw new Error(error);
        }
    }
}
exports.default = AdminSolana;
//# sourceMappingURL=index.js.map