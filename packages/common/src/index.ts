export * from './fetch';
export * from './currencies';

export const paymentStatuses = ["WAITING", "CONFIRMING", "CONFIRMED", "SENDING", "FINISHED", "PARTIALLY_PAID", "FAILED", "EXPIRED"] as const;
export type PaymentStatusType = typeof paymentStatuses[number];

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