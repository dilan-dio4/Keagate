import { AvailableTickers, AvailableCoins } from "@snow/common/src";
import WAValidator from 'multicoin-address-validator';

export default abstract class GenericWallet {
    protected ticker: AvailableTickers;
    protected coinName: AvailableCoins;
    
    constructor(public publicKey: string, public privateKey: string) {}
    abstract getBalance(): Promise<{ result: { confirmedBalance: number; unconfirmedBalance?: number; } }>;
    abstract sendTransaction(destination: string, amount: number): Promise<{ result: string }>;
    // confirmTransaction
    isValidAddress(address: string): boolean {
        return WAValidator.validate(address, this.ticker);
    }
}