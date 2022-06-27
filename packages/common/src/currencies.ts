export const availableCoinlibCurrencies = ['DASH', 'LTC', 'XRP', 'BTC', 'ADA'] as const;
export const availableNativeCurrencies = ['SOL'] as const;

export type AvailableCoins = 'Solana' | 'Dash' | 'Litecoin' | 'Ripple' | 'Bitcoin' | 'Cardano';
export type AvailableCurrencies = typeof availableCoinlibCurrencies[number] | typeof availableNativeCurrencies[number];

export const currencies: Record<AvailableCurrencies, { name: string; explorer: string; networkName?: string }> = {
    LTC: {
        name: 'Litecoin',
        explorer: 'https://live.blockcypher.com/ltc/',
    },
    SOL: {
        networkName: 'Solana Mainnet',
        name: 'Solana',
        explorer: 'https://explorer.solana.com/',
    },
    DASH: {
        networkName: 'Dash Mainnet',
        name: 'Dash',
        explorer: 'https://explorer.dash.org/insight/',
    },
    BTC: {
        networkName: 'Bitcoin Network Mainnet',
        name: 'Bitcoin',
        explorer: 'https://live.blockcypher.com/btc/',
    },
    ADA: {
        name: 'Cardano',
        explorer: 'https://cardanoscan.io/',
    },
    XRP: {
        name: 'Ripple',
        explorer: 'https://xrpscan.com/',
        networkName: 'XRP Ledger',
    },
};
