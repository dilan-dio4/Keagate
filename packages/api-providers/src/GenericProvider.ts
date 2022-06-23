import { AvailableTickers } from "@snow/common";
import Big from 'big.js';

export default abstract class GenericProvider {
    public supportedCurrencies: AvailableTickers[];
    constructor(..._: any[]){ null; }
    abstract getBalance(address: string, ticker: AvailableTickers): Promise<{ result: { confirmedBalance: Big; unconfirmedBalance?: Big; } }>;
    public sendTransaction?(ticker: AvailableTickers, hexTransaction: string): Promise<{ result: string }>;
}