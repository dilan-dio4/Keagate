import GenericProvider from "./GenericProvider";
import { AvailableTickers, fGet, fPost, currencies } from "@snow/common/src";
import units from "./units";
import Big from 'big.js';

// https://documenter.getpostman.com/view/13630829/TVmFkLwy#cebd6a63-13bc-4ba1-81f7-360c88871b90

export default class TatumProvider extends GenericProvider {
    public supportedCurrencies: AvailableTickers[] = ["ltc", "btc", "ada", "xrp"];

    constructor(public apiKey: string, public location: "eu1" | "us-west1") {
        super();
    }

    async getBalance(ticker: AvailableTickers, address: string): Promise<{ result: { confirmedBalance: Big; unconfirmedBalance?: Big; }; }> {
        if (!this.supportedCurrencies.includes(ticker)) {
            throw new Error("Ticker not supported")
        }

        let confirmedBalance: Big;

        if (ticker === "btc" || ticker === "ltc") {
            const { outgoing, incoming } = await fGet(`https://api-${this.location}.tatum.io/v3/${currencies[ticker].name.toLowerCase()}/address/balance/${address}`, {
                'x-api-key': this.apiKey
            });
            const bigBalanceSatoshiLike = Big(incoming).minus(Big(outgoing));
            if (ticker === "btc") {
                confirmedBalance = bigBalanceSatoshiLike.times(Big(units.btc.satoshi));
            } else if (ticker === "ltc") {
                confirmedBalance = bigBalanceSatoshiLike.times(Big(units.ltc.litoshi));
            }
        } else if (ticker === "ada") {
            const { summary: { assetBalances } } = await fGet(`https://api-${this.location}.tatum.io/v3/${ticker}/account/${address}`, {
                'x-api-key': this.apiKey
            });

            for (const currAsset of assetBalances) {
                if (currAsset.asset.assetId === "ada") {
                    confirmedBalance = Big(currAsset.quantity).times(Big(units.ada.lovelace));
                    break;
                }
            }
        } else if (ticker === "xrp") {
            const { balance } = await fGet(`https://api-${this.location}.tatum.io/v3/${ticker}/account/${address}/balance`, {
                'x-api-key': this.apiKey
            });
            confirmedBalance = Big(balance).times(Big(units.xrp.drop));
        }

        return {
            result: {
                confirmedBalance,
                unconfirmedBalance: undefined
            }
        }

    }

    async sendTransaction(ticker: AvailableTickers, hexTransaction: string): Promise<{ result: string; }> {
        if (!this.supportedCurrencies.includes(ticker)) {
            throw new Error("Ticker not supported")
        }

        const route = (ticker === "ada" || ticker === "xrp") ? ticker : currencies[ticker].name.toLowerCase();

        const { txId } = await fPost(`https://api-${this.location}.tatum.io/v3/${route}/broadcast`, {
            txData: hexTransaction
        }, {
            'Content-Type': 'application/json',
            'x-api-key': this.apiKey
        })
        return { result: txId }
    }
}