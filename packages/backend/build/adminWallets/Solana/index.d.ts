import GenericWallet from "../GenericWallet";
import { AvailableCoins, AvailableTickers } from "../../currencies";
export default class Solana extends GenericWallet {
    private connection;
    ticker: AvailableTickers;
    coinName: AvailableCoins;
    constructor(...args: ConstructorParameters<typeof GenericWallet>);
    getBalance(): Promise<{
        result: {
            confirmedBalance: number;
            unconfirmedBalance: any;
        };
    }>;
    sendTransaction(destination: string, amount: number): Promise<{
        result: string;
    }>;
}
