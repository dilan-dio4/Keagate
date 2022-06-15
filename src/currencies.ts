import Dash from "./wallets/Dash";
import Litecoin from "./wallets/Litecoin";
import Solana from "./wallets/Solana";

export type AvailableCoins = "Solana" | "Dash" | "Litecoin";
export type AvailableTickers = "sol" | "dash" | "ltc";
export type AvailableWallets = Dash | Litecoin | Solana;

const currencies: Record<AvailableTickers, { name: AvailableCoins }> = {
    "ltc": {
        name: "Litecoin",
    },
    "sol": {
        name: "Solana",
    },
    "dash": {
        name: "Dash",
    }
}

export default currencies;
