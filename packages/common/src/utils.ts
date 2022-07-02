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
            satoshis: Math.round(+currUtxo.value * (convertToSatoshis ? 1e8 : 1)),
        });
    }
    return out;
}

export function arrayIncludes<T>(arr: T[], ele: any): ele is T {
    return arr.includes(ele);
}
