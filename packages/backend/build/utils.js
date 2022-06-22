"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.decrypt = exports.encrypt = exports.isBase58 = exports.convertChainsoToNativeUtxo = void 0;
const crypto_1 = __importDefault(require("crypto"));
function convertChainsoToNativeUtxo(Utxos, address, convertToSatoshis = false) {
    const out = [];
    for (const currUtxo of Utxos) {
        out.push({
            address,
            outputIndex: currUtxo.output_no,
            script: currUtxo.script_hex,
            txId: currUtxo.txid,
            satoshis: Math.round(+currUtxo.value * (convertToSatoshis ? 1E8 : 1))
        });
    }
    return out;
}
exports.convertChainsoToNativeUtxo = convertChainsoToNativeUtxo;
const isBase58 = (value) => /^[A-HJ-NP-Za-km-z1-9]*$/.test(value);
exports.isBase58 = isBase58;
// https://gist.github.com/vlucas/2bd40f62d20c1d49237a109d491974eb?permalink_comment_id=3771967#gistcomment-3771967
const ENCRYPTION_KEY = process.env.INVOICE_ENCRYPTION_KEY || 'D(G+KbPeShVmYq3s6v9y$B&E)H@McQfT'; // Must be 256 bits (32 characters)
const IV_LENGTH = 16; // For AES, this is always 16
const iv = 'dac6ff95b69d8a5b48f100269552d0b6'.slice(0, IV_LENGTH);
function encrypt(text, encryptionKey = ENCRYPTION_KEY) {
    const cipher = crypto_1.default.createCipheriv('aes-256-cbc', Buffer.from(encryptionKey), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return encrypted.toString('hex');
}
exports.encrypt = encrypt;
function decrypt(text, encryptionKey = ENCRYPTION_KEY) {
    const encryptedText = Buffer.from(text, 'hex');
    const decipher = crypto_1.default.createDecipheriv('aes-256-cbc', Buffer.from(encryptionKey), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}
exports.decrypt = decrypt;
//# sourceMappingURL=utils.js.map