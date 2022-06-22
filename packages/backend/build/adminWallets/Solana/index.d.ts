import GenericAdminWallet from "../GenericAdminWallet";
import { AvailableTickers, AvailableCoins } from "@snow/common/src";
export default class AdminSolana extends GenericAdminWallet {
    private connection;
    ticker: AvailableTickers;
    coinName: AvailableCoins;
    constructor(...args: ConstructorParameters<typeof GenericAdminWallet>);
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
