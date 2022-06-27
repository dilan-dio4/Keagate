export * from './fetch';
export * from './currencies';

export const paymentStatuses = ['WAITING', 'CONFIRMING', 'CONFIRMED', 'SENDING', 'FINISHED', 'PARTIALLY_PAID', 'FAILED', 'EXPIRED'] as const;
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
            satoshis: Math.round(+currUtxo.value * (convertToSatoshis ? 1e8 : 1)),
        });
    }
    return out;
}

// https://stackoverflow.com/a/66702014
export type ConcreteConstructor<T extends abstract new (...args: any) => any> = (T extends abstract new (...args: infer A) => infer R
    ? new (...args: A) => R
    : never) &
    T;
