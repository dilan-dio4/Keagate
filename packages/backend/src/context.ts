import idsToProviders from "@snow/api-providers/src";
import { availableCoinlibCurrencies, AvailableCurrencies, availableNativeCurrencies, ConcreteConstructor, currencies } from "@snow/common/src";
import { CoinPayments, NetworkType, SUPPORTED_NETWORK_SYMBOLS, AnyPayments } from 'coinlib-port';
import { WithId } from "mongodb";
import GenericAdminWallet from "./adminWallets/GenericAdminWallet";
import AdminSolana from "./adminWallets/Solana";
import config from './config';
import { getExistingPayments } from "./mongo";
import GenericCoinlibWrapper from "./transactionalWallets/coinlib/GenericCoinlibWrapper";
import GenericTransactionalWallet from "./transactionalWallets/GenericTransactionalWallet";
import GenericNativeTransactionalWallet from "./transactionalWallets/native/GenericNativeTransactionalWallet";
import TransactionalSolana from "./transactionalWallets/native/Solana";
import { CoinlibPayment, NativePayment } from "./types";

class SnowContext {
    public enabledNativeCurrencies: (typeof availableNativeCurrencies[number])[] = [];
    public enabledCoinlibCurrencies: (typeof availableCoinlibCurrencies[number])[] = [];
    public coinlibCurrencyToClient: Record<string, AnyPayments<any>> = {};
    public nativeCurrencyToClient: Record<typeof availableNativeCurrencies[number],
        {
            Admin: ConcreteConstructor<typeof GenericAdminWallet>
            Transactional: ConcreteConstructor<typeof GenericNativeTransactionalWallet>
        }> = {
            SOL: {
                Admin: AdminSolana,
                Transactional: TransactionalSolana,
            }
        }
    public activePayments: Record<string, GenericCoinlibWrapper | GenericTransactionalWallet> = {}

    public async init() {
        // Preserve order
        this.initEnabledCurrencies()
        await this.initCoinlibToCurrencyClient()
        await this.initActivePayments()
    }

    private initEnabledCurrencies() {
        for (const currency of Object.keys(currencies)) {
            const typedCurrency = currency as any;
            if (!!config.has(currency) && !!config.getTyped(typedCurrency).ADMIN_PUBLIC_KEY) {
                if (availableNativeCurrencies.includes(typedCurrency)) {
                    this.enabledNativeCurrencies.push(typedCurrency)
                } else if (availableCoinlibCurrencies.includes(typedCurrency)) {
                    this.enabledCoinlibCurrencies.push(typedCurrency)
                }
            }
        }
    }

    private async initCoinlibToCurrencyClient() {
        const coinPayments = new CoinPayments({ seed: config.getTyped('SEED' as any), network: NetworkType.Mainnet });
        // type coinlibToCurrenyType = {
        //     [key in SUPPORTED_NETWORK_SYMBOLS[number]]: string;
        // }
        for (const _currency of SUPPORTED_NETWORK_SYMBOLS) {
            if (!this.enabledCoinlibCurrencies.includes(_currency)) {
                continue;
            }
            const currClient = coinPayments.forNetwork(_currency);
            await currClient.init(); // TODO: Promise.all
            this.coinlibCurrencyToClient[_currency] = currClient;
        }
    }

    private async initActivePayments() {
        // Collect all existing native payments in mongo and initalize them in the activePayments maps
        const _activeNativePayments = await getExistingPayments() as WithId<NativePayment | CoinlibPayment>[];
        for (const _currActivePayment of _activeNativePayments) {
            const currTxCurrency = _currActivePayment.currency as AvailableCurrencies

            if (_currActivePayment.type === "native") {
                if (this.enabledNativeCurrencies.includes(currTxCurrency as any)) {
                    const params = [
                        (id) => delete this.activePayments[id],
                        config.getTyped(currTxCurrency).PROVIDER
                            ? new idsToProviders[config.getTyped(currTxCurrency).PROVIDER](
                                config.getTyped(currTxCurrency).PROVIDER_PARAMS,
                            )
                            : undefined,
                        this.nativeCurrencyToClient[currTxCurrency].Admin,
                    ] as const

                    this.activePayments[_currActivePayment._id.toString()] = new this.nativeCurrencyToClient[
                        currTxCurrency
                    ].Transactional(...params).fromManual({
                        ...(_currActivePayment as any),
                        id: _currActivePayment._id.toString(),
                    })
                } else {
                    console.error(`No transactional wallet found/enabled for currency ${_currActivePayment.currency}: ${_currActivePayment._id}`)
                    continue
                }
            } else if (_currActivePayment.type === "coinlib") {
                if (this.enabledCoinlibCurrencies.includes(currTxCurrency as any)) {
                    const params = [
                        (id) => delete this.activePayments[id],
                        this.coinlibCurrencyToClient[currTxCurrency],
                        _currActivePayment.walletIndex as number,
                    ] as const

                    this.activePayments[_currActivePayment._id.toString()] = new GenericCoinlibWrapper(...params).fromManual({
                        ...(_currActivePayment as any),
                        id: _currActivePayment._id.toString(),
                    })
                } else {
                    console.error(`No transactional wallet found/enabled for currency ${_currActivePayment.currency}: ${_currActivePayment._id}`)
                    continue
                }
            }
        }
    }
}

export default new SnowContext()