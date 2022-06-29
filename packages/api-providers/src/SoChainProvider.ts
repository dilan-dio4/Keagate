import GenericProvider from './GenericProvider';
import { AvailableCurrencies, fGet } from '@firagate/common/src';

// https://documenter.getpostman.com/view/13630829/TVmFkLwy#cebd6a63-13bc-4ba1-81f7-360c88871b90

export default class SoChainProvider extends GenericProvider {
    public supportedCurrencies: AvailableCurrencies[] = ['DASH', 'LTC', 'BTC'];

    async getBalance(currency: AvailableCurrencies, address: string): Promise<{ result: { confirmedBalance: number; unconfirmedBalance?: number } }> {
        if (!this.supportedCurrencies.includes(currency)) {
            throw new Error('Currency not supported');
        }

        const {
            data: { confirmed_balance, unconfirmed_balance },
        } = await fGet(`https://chain.so/api/v2/get_address_balance/${currency.toUpperCase()}/${address}`);
        return {
            result: {
                confirmedBalance: +confirmed_balance,
                unconfirmedBalance: +unconfirmed_balance,
            },
        };
    }
}
