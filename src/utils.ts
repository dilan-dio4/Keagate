interface NativeUtxo {
    txId: string;
    outputIndex: number;
    address: string;
    script: string;
    satoshis: number;
}

export function convertChainsoToNativeUtxo(Utxos: Record<string, any>[], address: string, convertToSatoshis = false): NativeUtxo[] {
    const out: NativeUtxo[] = [];
    for (const currUtxo of Utxos) {
        out.push({
            address,
            outputIndex: currUtxo.output_no,
            script: currUtxo.script_hex,
            txId: currUtxo.txid,
            satoshis: Math.round(+currUtxo.value * (convertToSatoshis ? 1E8 : 1))
        })
    }
    return out;
}

export const isBase58 = (value: string): boolean => /^[A-HJ-NP-Za-km-z1-9]*$/.test(value);