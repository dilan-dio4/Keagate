interface NativeUtxo {
    txId: string;
    outputIndex: number;
    address: string;
    script: string;
    satoshis: number;
}
export declare function convertChainsoToNativeUtxo(Utxos: Record<string, any>[], address: string, convertToSatoshis?: boolean): NativeUtxo[];
export declare const isBase58: (value: string) => boolean;
export {};
