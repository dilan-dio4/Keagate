import { availableCoinlibCurrencies, AvailableCurrencies, availableNativeCurrencies, ConcreteConstructor, currencies } from '@keagate/common/src';
import {  AnyPayments } from 'coinlib-port';
import { WithId } from 'mongodb';
import GenericAdminWallet from './adminWallets/GenericAdminWallet';
import config from './config';
import { getExistingPayments } from './mongo';
import TransactionalCoinlibWrapper from './transactionalWallets/coinlib/TransactionalCoinlibWrapper';
import GenericTransactionalWallet from './transactionalWallets/GenericTransactionalWallet';
import GenericNativeTransactionalWallet from './transactionalWallets/native/GenericNativeTransactionalWallet';
import { CoinlibPayment, NativePayment } from './types';
import { getCoinlibCurrencyToClient, getNativeCurrencyToClient } from './currenciesToClients';
import { arrayIncludes } from './utils';

class KeagateContext {
    public enabledNativeCurrencies: typeof availableNativeCurrencies[number][] = [];
    public enabledCoinlibCurrencies: typeof availableCoinlibCurrencies[number][] = [];
    public coinlibCurrencyToClient: Record<string, AnyPayments<any>> = {};
    public nativeCurrencyToClient: Record<
        typeof availableNativeCurrencies[number],
        {
            Admin: ConcreteConstructor<typeof GenericAdminWallet>;
            Transactional: ConcreteConstructor<typeof GenericNativeTransactionalWallet>;
        }
    >;

    public activePayments: Record<string, GenericTransactionalWallet> = {};

    public async init() {
        // Preserve order
        this.initEnabledCurrencies();
        this.nativeCurrencyToClient = getNativeCurrencyToClient();
        this.coinlibCurrencyToClient = await getCoinlibCurrencyToClient();
        await this.initActivePayments();
    }

    private initEnabledCurrencies() {
        for (const currency of Object.keys(currencies)) {
            const typedCurrency = currency as any;
            if (!!config.has(currency) && !!config.getTyped(typedCurrency).ADMIN_PUBLIC_KEY) {
                if (availableNativeCurrencies.includes(typedCurrency)) {
                    this.enabledNativeCurrencies.push(typedCurrency);
                } else if (availableCoinlibCurrencies.includes(typedCurrency)) {
                    this.enabledCoinlibCurrencies.push(typedCurrency);
                }
            }
        }
    }

    private async initActivePayments() {
        // Collect all existing native payments in mongo and initalize them in the activePayments maps
        const _activeNativePayments = (await getExistingPayments()) as WithId<NativePayment | CoinlibPayment>[];
        for (const _currActivePayment of _activeNativePayments) {
            const currTxCurrency = _currActivePayment.currency as AvailableCurrencies;

            if (_currActivePayment.type === 'native') {
                if (arrayIncludes<typeof availableNativeCurrencies[number]>(this.enabledNativeCurrencies, currTxCurrency)) {
                    this.activePayments[_currActivePayment._id.toString()] = new this.nativeCurrencyToClient[currTxCurrency].Transactional().fromManual(
                        {
                            ..._currActivePayment,
                            id: _currActivePayment._id.toString(),
                        },
                        {
                            onDie: (id) => delete this.activePayments[id],
                            adminWalletClass: this.nativeCurrencyToClient[currTxCurrency].Admin,
                        },
                    );
                } else {
                    console.error(`No transactional wallet found/enabled for currency ${_currActivePayment.currency}: ${_currActivePayment._id}`);
                    continue;
                }
            } else if (_currActivePayment.type === 'coinlib') {
                if (arrayIncludes<typeof availableCoinlibCurrencies[number]>(this.enabledCoinlibCurrencies, currTxCurrency)) {
                    this.activePayments[_currActivePayment._id.toString()] = new TransactionalCoinlibWrapper().fromManual(
                        {
                            ..._currActivePayment,
                            id: _currActivePayment._id.toString(),
                        },
                        {
                            onDie: (id) => delete this.activePayments[id],
                            walletIndex: _currActivePayment.walletIndex,
                            currency: currTxCurrency,
                            coinlibPayment: this.coinlibCurrencyToClient[currTxCurrency]
                        },
                    );
                } else {
                    console.error(`No transactional wallet found/enabled for currency ${_currActivePayment.currency}: ${_currActivePayment._id}`);
                    continue;
                }
            }
        }
    }
}

export default new KeagateContext();
