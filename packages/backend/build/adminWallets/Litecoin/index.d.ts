import GenericAdminWallet from "../GenericAdminWallet";
import { AvailableCoins, AvailableTickers } from "@snow/common/src";
export default class AdminLitecoin extends GenericAdminWallet {
    private mediumGasFee;
    ticker: AvailableTickers;
    coinName: AvailableCoins;
    constructor(...args: ConstructorParameters<typeof GenericAdminWallet>);
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
