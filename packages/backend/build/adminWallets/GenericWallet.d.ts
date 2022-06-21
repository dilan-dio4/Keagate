import { AvailableTickers, AvailableCoins } from "../currencies";
export default abstract class GenericWallet {
    publicKey: string;
    privateKey: string;
    protected ticker: AvailableTickers;
    protected coinName: AvailableCoins;
    constructor(publicKey: string, privateKey: string);
    abstract getBalance(): Promise<{
        result: {
            confirmedBalance: number;
            unconfirmedBalance?: number;
        };
    }>;
    abstract sendTransaction(destination: string, amount: number): Promise<{
        result: string;
    }>;
    isValidAddress(address: string): boolean;
}
