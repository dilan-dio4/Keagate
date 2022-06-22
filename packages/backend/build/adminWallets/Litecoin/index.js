"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const GenericAdminWallet_1 = __importDefault(require("../GenericAdminWallet"));
const utils_1 = require("../../utils");
const bitcore_lib_ltc_1 = require("bitcore-lib-ltc");
const src_1 = require("@snow/common/src");
class AdminLitecoin extends GenericAdminWallet_1.default {
    constructor(...args) {
        super(...args);
        this.ticker = "ltc";
        this.coinName = "Litecoin";
        (0, src_1.fGet)('https://api.blockcypher.com/v1/ltc/main')
            .then(({ medium_fee_per_kb }) => this.mediumGasFee = medium_fee_per_kb);
    }
    async getBalance() {
        const { data: { confirmed_balance, unconfirmed_balance } } = await (0, src_1.fGet)(`https://chain.so/api/v2/get_address_balance/LTC/${this.publicKey}`);
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
        if (!this.mediumGasFee) {
            throw new Error("Gathering gas fees");
        }
        const { data: { txs } } = await (0, src_1.fGet)(`https://chain.so/api/v2/get_tx_unspent/LTC/${this.publicKey}`);
        let totalBalance = 0;
        for (const currUtxo of txs) {
            totalBalance += +currUtxo.value;
        }
        if (totalBalance < amount) {
            throw new Error("Insufficient funds");
        }
        const totalBalanceInSatoshis = Math.round(totalBalance * 1E8);
        const transactionValInSatoshis = Math.round(amount * 1E8);
        const ltcTransaction = new bitcore_lib_ltc_1.Transaction()
            .from((0, utils_1.convertChainsoToNativeUtxo)(txs, this.publicKey))
            .to(destination, transactionValInSatoshis - this.mediumGasFee)
            .to(this.publicKey, totalBalanceInSatoshis - transactionValInSatoshis)
            .change(this.publicKey)
            .sign(this.privateKey);
        // https://bitcoincore.org/en/doc/0.19.0/rpc/rawtransactions/sendrawtransaction/
        try {
            const { result } = await (0, src_1.fPost)('https://ltc.nownodes.io', {
                "jsonrpc": "2.0",
                "method": "sendrawtransaction",
                "params": [
                    ltcTransaction.uncheckedSerialize()
                ],
                "id": "test",
                "API_key": "f994ff7a-12b4-405a-b214-941ab2df13ce"
            }, {
                'Content-Type': 'application/json'
            });
            return { result };
        }
        catch (error) {
            console.error(error);
        }
    }
}
exports.default = AdminLitecoin;
//# sourceMappingURL=index.js.map