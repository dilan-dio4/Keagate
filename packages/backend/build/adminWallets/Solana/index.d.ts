import GenericWallet from "../GenericWallet";
import { AvailableTickers, AvailableCoins } from "@snow/common/src";
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
