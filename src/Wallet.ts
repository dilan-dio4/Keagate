import { AvailableTickers, AvailableCoins } from "./currencies";
import WAValidator from 'multicoin-address-validator';

export abstract class GenericWallet {
    constructor(public ticker: AvailableTickers, public coinName: AvailableCoins, public publicKey: string, public privateKey: string) {}
    abstract getBalance(): Promise<{ result: number }>;
    abstract sendTransaction(destination: string, amount: number): Promise<{ result: string }>;
    // confirmTransaction
    isValidAddress(address: string): boolean {
        return WAValidator.validate(address, this.ticker);
    }
}