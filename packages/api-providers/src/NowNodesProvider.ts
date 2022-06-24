import GenericProvider from "./GenericProvider";
import { AvailableCurrencies, fGet, fPost } from "@snow/common/src";
import units from "./units";
import Big from 'big.js';

// https://documenter.getpostman.com/view/13630829/TVmFkLwy#cebd6a63-13bc-4ba1-81f7-360c88871b90

export default class NowNodesProvider extends GenericProvider {
    public supportedCurrencies: AvailableCurrencies[] = ["dash", "ltc", "btc"];

    constructor(public apiKey: string, public currenciesToRpcUrls: Partial<Record<AvailableCurrencies, string>>) {
        super();
    }

    async getBalance(currency: AvailableCurrencies, address: string): Promise<{ result: { confirmedBalance: number; unconfirmedBalance?: number; }; }> {
        if (!this.supportedCurrencies.includes(currency)) {
            throw new Error("Currency not supported")
        }

        const { balance } = await fGet(`https://${currency}book.nownodes.io/api/v2/address/${address}`, {
            "api-key": this.apiKey
        });
        const bigBalanceSatoshiLike = Big(balance);
        let confirmedBalance: Big;
        if (currency === "dash") {
            confirmedBalance = bigBalanceSatoshiLike.times(Big(units.dash.duff));
        } else if (currency === "ltc") {
            confirmedBalance = bigBalanceSatoshiLike.times(Big(units.ltc.litoshi));
        } else if (currency === "btc") {
            confirmedBalance = bigBalanceSatoshiLike.times(Big(units.btc.satoshi));
        }
        return {
            result: {
                confirmedBalance: confirmedBalance.toNumber(),
                unconfirmedBalance: undefined
            }
        }
    }

    async sendTransaction(currency: AvailableCurrencies, hexTransaction: string): Promise<{ result: string; }> {
        if (!this.supportedCurrencies.includes(currency)) {
            throw new Error("Currency not supported")
        }

        // TODO: revert to getblocks
        try {
            const { result, error } = await fPost(`https://${currency}.nownodes.io`, {
                "jsonrpc": "2.0",
                "method": "sendrawtransaction",
                "params": [
                    hexTransaction,
                    0
                ],
                "API_key": this.apiKey
            }, {
                'Content-Type': 'application/json'
            });

            if (result === null) {
                throw new Error(error)
            }
            return { result };
        } catch (error) {
            console.error(JSON.stringify(error));
        }
    }
}