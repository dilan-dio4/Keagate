import Dash from "./adminWallets/Dash";
import Litecoin from "./adminWallets/Litecoin";
import Solana from "./adminWallets/Solana";

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
