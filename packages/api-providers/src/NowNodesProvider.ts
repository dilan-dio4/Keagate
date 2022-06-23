import GenericProvider from "./GenericProvider";
import { AvailableTickers, fGet, fPost } from "@snow/common/src";
import units from "./units";
import Big from 'big.js';

// https://documenter.getpostman.com/view/13630829/TVmFkLwy#cebd6a63-13bc-4ba1-81f7-360c88871b90

export default class NowNodesProvider extends GenericProvider {
    public supportedCurrencies: AvailableTickers[] = ["dash", "ltc", "btc"];

    constructor(public apiKey: string, public currenciesToRpcUrls: Partial<Record<AvailableTickers, string>>) {
        super();
    }

    async getBalance(ticker: AvailableTickers, address: string): Promise<{ result: { confirmedBalance: number; unconfirmedBalance?: number; }; }> {
        if (!this.supportedCurrencies.includes(ticker)) {
            throw new Error("Ticker not supported")
        }

        const { balance } = await fGet(`https://${ticker}book.nownodes.io/api/v2/address/${address}`, {
            "api-key": this.apiKey
        });
        const bigBalanceSatoshiLike = Big(balance);
        let confirmedBalance: Big;
        if (ticker === "dash") {
            confirmedBalance = bigBalanceSatoshiLike.times(Big(units.dash.duff));
        } else if (ticker === "ltc") {
            confirmedBalance = bigBalanceSatoshiLike.times(Big(units.ltc.litoshi));
        } else if (ticker === "btc") {
            confirmedBalance = bigBalanceSatoshiLike.times(Big(units.btc.satoshi));
        }
        return {
            result: {
                confirmedBalance: confirmedBalance.toNumber(),
                unconfirmedBalance: undefined
            }
        }
    }

    async sendTransaction(ticker: AvailableTickers, hexTransaction: string): Promise<{ result: string; }> {
        if (!this.supportedCurrencies.includes(ticker)) {
            throw new Error("Ticker not supported")
        }

        try {
            const { result } = await fPost(`https://${ticker}.nownodes.io`, {
                "jsonrpc": "2.0",
                "method": "sendrawtransaction",
                "params": [
                    hexTransaction
                ],
                "id": "test",
                "API_key": this.apiKey
            }, {
                'Content-Type': 'application/json'
            })
            return { result };
        } catch (error) {
            console.error(error);
        }
    }
}