"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const GenericWallet_1 = __importDefault(require("../GenericWallet"));
const fetch_1 = require("../../fetch");
const dashcore_lib_1 = require("@dashevo/dashcore-lib");
const utils_1 = require("../../utils");
// https://jestersimpps.github.io/my-first-experience-with-bitpay-bitcore/
class Dash extends GenericWallet_1.default {
    constructor() {
        super(...arguments);
        this.ticker = "dash";
        this.coinName = "Dash";
    }
    async getBalance() {
        const { data: { confirmed_balance, unconfirmed_balance } } = await (0, fetch_1.fGet)(`https://chain.so/api/v2/get_address_balance/DASH/${this.publicKey}`);
        return {
            result: {
                confirmedBalance: +confirmed_balance,
                unconfirmedBalance: +unconfirmed_balance
            }
        };
    }
    async sendTransaction(destination, amount) {
        if (!this.isValidAddress(destination)) {
            throw new Error("Invalid destination address");
        }
        const { data: { txs } } = await (0, fetch_1.fGet)(`https://chain.so/api/v2/get_tx_unspent/DASH/${this.publicKey}`);
        let totalBalance = 0;
        for (const currUtxo of txs) {
            totalBalance += +currUtxo.value;
        }
        if (totalBalance < amount) {
            throw new Error("Insufficient funds");
        }
        const dashTransaction = new dashcore_lib_1.Transaction()
            .from((0, utils_1.convertChainsoToNativeUtxo)(txs, this.publicKey, true))
            .to(destination, Math.round(amount * 1E8))
            .change(this.publicKey)
            .sign(this.privateKey);
        if (dashTransaction.getSerializationError(undefined)) {
            const error = dashTransaction.getSerializationError(undefined);
            throw error;
        }
        const { result } = await (0, fetch_1.fPost)(process.env.DASH_RPC_URL, {
            "jsonrpc": "2.0",
            "method": "sendrawtransaction",
            "params": [
                dashTransaction.serialize(false)
            ],
            "id": "getblock.io"
        }, {
            'Content-Type': 'application/json',
            'x-api-key': process.env.DASH_RPC_API_KEY
        });
        return { result };
    }
}
exports.default = Dash;
//# sourceMappingURL=index.js.map