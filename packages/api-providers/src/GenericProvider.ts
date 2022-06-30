import { AvailableCurrencies } from '@keagate/common/src';

export default abstract class GenericProvider {
    public supportedCurrencies: AvailableCurrencies[];
    constructor(..._: any[]) {
        null;
    }
    abstract getBalance(currency: AvailableCurrencies, address: string): Promise<{ result: { confirmedBalance: number; unconfirmedBalance?: number } }>;
    public sendTransaction?(currency: AvailableCurrencies, hexTransaction: string): Promise<{ result: string }>;
}
