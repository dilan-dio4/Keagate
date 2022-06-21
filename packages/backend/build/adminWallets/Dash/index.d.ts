import GenericWallet from "../GenericWallet";
import { AvailableCoins, AvailableTickers } from "../../currencies";
export default class Dash extends GenericWallet {
    ticker: AvailableTickers;
    coinName: AvailableCoins;
    getBalance(): Promise<{
        result: {
            confirmedBalance: number;
            unconfirmedBalance: number;
        };
    }>;
    sendTransaction(destination: string, amount: number): Promise<{
        result: any;
    }>;
}
