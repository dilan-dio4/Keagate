import Dash from "./adminWallets/Dash";
import Litecoin from "./adminWallets/Litecoin";
import Solana from "./adminWallets/Solana";
export declare type AvailableCoins = "Solana" | "Dash" | "Litecoin";
export declare type AvailableTickers = "sol" | "dash" | "ltc";
export declare type AvailableWallets = Dash | Litecoin | Solana;
declare const currencies: Record<AvailableTickers, {
    name: AvailableCoins;
    explorer: string;
    networkName?: string;
}>;
export default currencies;
