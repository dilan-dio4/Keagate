export type AvailableCoins = "Solana" | "Dash" | "Litecoin" | "Ripple" | "Bitcoin" | "Cardano";
export type AvailableCurrencies = "sol" | "dash" | "ltc" | "xrp" | "btc" | "ada";

export const currencies: Record<AvailableCurrencies, { name: AvailableCoins; explorer: string; networkName?: string; }> = {
    "ltc": {
        name: "Litecoin",
        explorer: "https://live.blockcypher.com/ltc/",
    },
    "sol": {
        networkName: "Solana Mainnet",
        name: "Solana",
        explorer: "https://explorer.solana.com/"
    },
    "dash": {
        networkName: "Dash Mainnet",
        name: "Dash",
        explorer: "https://explorer.dash.org/insight/"
    },
    "btc": {
        networkName: "Bitcoin Network Mainnet",
        name: "Bitcoin",
        explorer: "https://live.blockcypher.com/btc/"
    },
    "ada": {
        name: "Cardano",
        explorer: "https://cardanoscan.io/"
    },
    "xrp": {
        name: "Ripple",
        explorer: "https://xrpscan.com/",
        networkName: "XRP Ledger"
    }
}
