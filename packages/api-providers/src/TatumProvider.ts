import GenericProvider from './GenericProvider';
import { AvailableCurrencies, fGet, fPost, currencies } from '@keagate/common/src';
import units from './units';
import Big from 'big.js';

// https://documenter.getpostman.com/view/13630829/TVmFkLwy#cebd6a63-13bc-4ba1-81f7-360c88871b90

export default class TatumProvider extends GenericProvider {
    public supportedCurrencies: AvailableCurrencies[] = ['LTC', 'BTC'];

    constructor(public apiKey: string, public location: 'eu1' | 'us-west1') {
        super();
    }

    async getBalance(currency: AvailableCurrencies, address: string): Promise<{ result: { confirmedBalance: number; unconfirmedBalance?: number } }> {
        if (!this.supportedCurrencies.includes(currency)) {
            throw new Error('Currency not supported');
        }

        let confirmedBalance: Big;

        if (currency === 'BTC' || currency === 'LTC') {
            const { outgoing, incoming } = await fGet(
                `https://api-${this.location}.tatum.io/v3/${currencies[currency].name.toLowerCase()}/address/balance/${address}`,
                {
                    'x-api-key': this.apiKey,
                },
            );
            const bigBalanceSatoshiLike = Big(incoming).minus(Big(outgoing));
            if (currency === 'BTC') {
                confirmedBalance = bigBalanceSatoshiLike.times(Big(units.btc.satoshi));
            } else if (currency === 'LTC') {
                confirmedBalance = bigBalanceSatoshiLike.times(Big(units.ltc.litoshi));
            }
        } 
        // else if (currency === 'ADA') {
        //     const {
        //         summary: { assetBalances },
        //     } = await fGet(`https://api-${this.location}.tatum.io/v3/${currency}/account/${address}`, {
        //         'x-api-key': this.apiKey,
        //     });

        //     for (const currAsset of assetBalances) {
        //         if (currAsset.asset.assetId === 'ada') {
        //             confirmedBalance = Big(currAsset.quantity).times(Big(units.ada.lovelace));
        //             break;
        //         }
        //     }
        // } else if (currency === 'XRP') {
        //     const { balance } = await fGet(`https://api-${this.location}.tatum.io/v3/${currency}/account/${address}/balance`, {
        //         'x-api-key': this.apiKey,
        //     });
        //     confirmedBalance = Big(balance).times(Big(units.xrp.drop));
        // }

        return {
            result: {
                confirmedBalance: confirmedBalance.toNumber(),
                unconfirmedBalance: undefined,
            },
        };
    }

    async sendTransaction(currency: AvailableCurrencies, hexTransaction: string): Promise<{ result: string }> {
        if (!this.supportedCurrencies.includes(currency)) {
            throw new Error('Currency not supported');
        }

        // const route = currency === 'ADA' || currency === 'XRP' ? currency : currencies[currency].name.toLowerCase();
        const route = currencies[currency].name.toLowerCase();

        const { txId } = await fPost(
            `https://api-${this.location}.tatum.io/v3/${route}/broadcast`,
            {
                txData: hexTransaction,
            },
            {
                'Content-Type': 'application/json',
                'x-api-key': this.apiKey,
            },
        );
        return { result: txId };
    }
}
