import Cardano from "./wallets/Cardano";
import Dash from "./wallets/Dash";
import Litecoin from "./wallets/Litecoin";
import Solana from "./wallets/Solana";

export type AvailableCoins = "Solana" | "Dash" | "Litecoin" | "Cardano";
export type AvailableTickers = "sol" | "dash" | "ltc" | "ada";
export type AvailableWallets = Dash | Litecoin | Solana | Cardano;

const currencies: Record<AvailableTickers, { name: AvailableCoins }> = {
    "ltc": {
        name: "Litecoin",
    },
    "sol": {
        name: "Solana",
    },
    "dash": {
        name: "Dash",
    },
    "ada": {
        name: "Cardano"
    }
}

export default currencies;
