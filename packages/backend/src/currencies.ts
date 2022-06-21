import Dash from "./adminWallets/Dash";
import Litecoin from "./adminWallets/Litecoin";
import Solana from "./adminWallets/Solana";

export type AvailableCoins = "Solana" | "Dash" | "Litecoin";
export type AvailableTickers = "sol" | "dash" | "ltc";
export type AvailableWallets = Dash | Litecoin | Solana;

const currencies: Record<AvailableTickers, { name: AvailableCoins; explorer: string; networkName?: string; }> = {
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
    }
}

export default currencies;
