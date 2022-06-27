import { AvailableCurrencies, AvailableCoins } from '@snow/common/src';
import WAValidator from 'multicoin-address-validator';
import { GenericProvider } from '@snow/api-providers/src';

export default abstract class GenericAdminWallet {
    protected currency: AvailableCurrencies;
    protected coinName: AvailableCoins;

    constructor(public publicKey: string, public privateKey: string, public apiProvider: GenericProvider) {}
    abstract getBalance(): Promise<{ result: { confirmedBalance: number; unconfirmedBalance?: number } }>;
    abstract sendTransaction(destination: string, amount: number): Promise<{ result: string }>;
    // confirmTransaction
    isValidAddress(address: string): boolean {
        return WAValidator.validate(address, this.currency);
    }
}
