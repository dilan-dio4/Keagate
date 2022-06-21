"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isBase58 = exports.convertChainsoToNativeUtxo = void 0;
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
// export function ab2str(buf: Uint8Array) {
//     return Buffer.from(buf).toString('base64');
// }
// export function str2ab(str: string) {
//     return new Uint8Array(Buffer.from(str, 'base64'))
// }
//# sourceMappingURL=utils.js.map