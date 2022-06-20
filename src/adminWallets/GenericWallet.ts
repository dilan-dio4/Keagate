import { AvailableTickers, AvailableCoins } from "../currencies";
import WAValidator from 'multicoin-address-validator';

export default abstract class GenericWallet {
    public ticker: AvailableTickers;
    public coinName: AvailableCoins;
    
    constructor(public publicKey: string, public privateKey: string) {}
    abstract getBalance(): Promise<{ result: { confirmedBalance: number; unconfirmedBalance?: number; } }>;
    abstract sendTransaction(destination: string, amount: number): Promise<{ result: string }>;
    // confirmTransaction
    isValidAddress(address: string): boolean {
        return WAValidator.validate(address, this.ticker);
    }
}