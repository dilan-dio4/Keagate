import { AvailableTickers, AvailableCoins } from "./currencies";
import WAValidator from 'multicoin-address-validator';

export interface IWallet {
    ticker: AvailableTickers;
    coinName: AvailableCoins;
    publicKey: string;
    privateKey: string;
    getBalance(): Promise<number>;
    sendTransaction(destination: string, amount: number): Promise<string>;
    isValidAddress(address: string): boolean;
    // confirmTransaction
}

export class GenericWallet {
    constructor(public ticker: AvailableTickers, public coinName: AvailableCoins, public publicKey: string, public privateKey: string) {}
    isValidAddress(address: string): boolean {
        return WAValidator.validate(address, this.ticker);
    }
}