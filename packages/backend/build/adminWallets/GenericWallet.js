"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const multicoin_address_validator_1 = __importDefault(require("multicoin-address-validator"));
class GenericWallet {
    constructor(publicKey, privateKey) {
        this.publicKey = publicKey;
        this.privateKey = privateKey;
    }
    // confirmTransaction
    isValidAddress(address) {
        return multicoin_address_validator_1.default.validate(address, this.ticker);
    }
}
exports.default = GenericWallet;
//# sourceMappingURL=GenericWallet.js.map