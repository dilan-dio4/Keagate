export const availableCoinlibCurrencies = ['DASH', 'LTC', 'BTC', 'ETH', 'DOGE'] as const;
export const availableNativeCurrencies = ['SOL', 'MATIC'] as const;

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
    // ADA: {
    //     name: 'Cardano',
    //     explorer: 'https://cardanoscan.io/',
    // },
    // XRP: {
    //     name: 'Ripple',
    //     explorer: 'https://xrpscan.com/',
    //     networkName: 'XRP Ledger',
    // },
    // TRX: {
    //     name: 'Tron',
    //     explorer: 'https://tronscan.org',
    //     networkName: 'TRON network',
    // },
    MATIC: {
        name: 'Polygon',
        explorer: 'https://polygonscan.com/',
        networkName: 'Polygon PoS Mainnet',
    },
    DOGE: {
        name: 'Dogecoin',
        explorer: 'https://dogechain.info/',
    },
    ETH: {
        name: 'Ethereum',
        explorer: 'https://etherscan.io/',
        networkName: 'Ethereum Mainnet'
    },
    // XLM: {
    //     name: 'Stellar',
    //     explorer: 'https://stellarchain.io/'
    // }
};
