import GenericProvider from "./GenericProvider";
import { AvailableTickers, fGet } from "@snow/common/src";
import Big from 'big.js';

// https://documenter.getpostman.com/view/13630829/TVmFkLwy#cebd6a63-13bc-4ba1-81f7-360c88871b90

export default class SoChainProvider extends GenericProvider {
    public supportedCurrencies: AvailableTickers[] = ["dash", "ltc", "btc"];

    async getBalance(ticker: AvailableTickers, address: string): Promise<{ result: { confirmedBalance: number; unconfirmedBalance?: number; }; }> {
        if (!this.supportedCurrencies.includes(ticker)) {
            throw new Error("Ticker not supported")
        }

        const { data: { confirmed_balance, unconfirmed_balance } } = await fGet(`https://chain.so/api/v2/get_address_balance/${ticker.toUpperCase()}/${address}`);
        return { 
            result: {
                confirmedBalance: +confirmed_balance,
                unconfirmedBalance: +unconfirmed_balance
            } 
        };
    }
}