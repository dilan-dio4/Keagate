import GenericAdminWallet from "../GenericAdminWallet";
import { AvailableCoins, AvailableTickers } from "@snow/common/src";
export default class AdminDash extends GenericAdminWallet {
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
