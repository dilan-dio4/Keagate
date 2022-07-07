import { availableCoinlibCurrencies, availableNativeCurrencies, ConcreteConstructor } from '@keagate/common';
import { AnyPayments, CoinPayments, NetworkType, SUPPORTED_NETWORK_SYMBOLS } from 'coinlib-port';
import config from './config';
import GenericAdminWallet from './adminWallets/GenericAdminWallet';
import AdminPolygon from './adminWallets/native/Polygon';
import AdminSolana from './adminWallets/native/Solana';
import GenericNativeTransactionalWallet from './transactionalWallets/native/GenericNativeTransactionalWallet';
import TransactionalPolygon from './transactionalWallets/native/Polygon';
import TransactionalSolana from './transactionalWallets/native/Solana';
import { deadLogger } from './utils';

export const getNativeCurrencyToClient = (): Record<
    typeof availableNativeCurrencies[number],
    {
        Admin: ConcreteConstructor<typeof GenericAdminWallet>;
        Transactional: ConcreteConstructor<typeof GenericNativeTransactionalWallet>;
    }
> => ({
    SOL: {
        Admin: AdminSolana,
        Transactional: TransactionalSolana,
    },
    MATIC: {
        Admin: AdminPolygon,
        Transactional: TransactionalPolygon,
    },
});

export async function getCoinlibCurrencyToClient(): Promise<Record<typeof availableCoinlibCurrencies[number], AnyPayments<any>>> {
    const coinPayments = new CoinPayments({ seed: config.getTyped('SEED'), network: NetworkType.Mainnet /** logger: deadLogger */ });
    const coinlibCurrencyToClient: Partial<Record<typeof availableCoinlibCurrencies[number], AnyPayments<any>>> = {};
    for (const _currency of SUPPORTED_NETWORK_SYMBOLS) {
        const currClient = coinPayments.forNetwork(_currency);
        await currClient.init();
        coinlibCurrencyToClient[_currency] = currClient;
    }
    return coinlibCurrencyToClient as Record<typeof availableCoinlibCurrencies[number], AnyPayments<any>>;
}
