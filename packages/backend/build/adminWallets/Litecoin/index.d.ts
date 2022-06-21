import GenericWallet from "../GenericWallet";
import { AvailableCoins, AvailableTickers } from "../../currencies";
export default class Litecoin extends GenericWallet {
    private mediumGasFee;
    ticker: AvailableTickers;
    coinName: AvailableCoins;
    constructor(...args: ConstructorParameters<typeof GenericWallet>);
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
