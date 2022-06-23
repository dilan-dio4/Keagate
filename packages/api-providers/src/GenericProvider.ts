import { AvailableTickers } from "@snow/common/src";

export default abstract class GenericProvider {
    public supportedCurrencies: AvailableTickers[];
    constructor(..._: any[]){ null; }
    abstract getBalance(ticker: AvailableTickers, address: string): Promise<{ result: { confirmedBalance: number; unconfirmedBalance?: number; } }>;
    public sendTransaction?(ticker: AvailableTickers, hexTransaction: string): Promise<{ result: string }>;
}