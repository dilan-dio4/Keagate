import { availableCoinlibCurrencies, AvailableCurrencies } from '@keagate/common/src';
import WAValidator from 'multicoin-address-validator';
import { GenericProvider } from '@keagate/api-providers/src';

export default abstract class GenericAdminWallet {
    public currency: AvailableCurrencies;
    protected privateKey: string;

    constructor(constructor: CoinlibAdminConstructor | NativeAdminConstructor) {
        this.setFromObject(constructor);
    }

    public abstract getBalance(): Promise<{ result: { confirmedBalance: number; unconfirmedBalance?: number } }>;
    public abstract sendTransaction(destination: string, amount: number): Promise<{ result: string }>;
    // confirmTransaction
    public isValidAddress(address: string): boolean {
        return WAValidator.validate(address, this.currency);
    }

    protected setFromObject(update: CoinlibAdminConstructor | NativeAdminConstructor) {
        for (const [key, val] of Object.entries(update)) {
            if (this[key] === undefined) {
                this[key] = val;
            }
        }
    }
}

interface RootAdminConstructor {
    privateKey: string;
}

export interface CoinlibAdminConstructor extends RootAdminConstructor {
    currency: typeof availableCoinlibCurrencies[number];
}

export interface NativeAdminConstructor extends RootAdminConstructor {
    publicKey: string; // TODO: don't need public
}
