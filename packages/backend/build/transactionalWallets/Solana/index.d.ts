import GenericWallet from '../GenericWallet';
import { AvailableCoins, AvailableTickers } from "@snow/common/src";
import { IFromNew } from "../../types";
export default class SolanaTransactional extends GenericWallet {
    private connection;
    currency: AvailableTickers;
    coinName: AvailableCoins;
    static TRANSFER_FEE_LAMPORTS: number;
    constructor(...args: ConstructorParameters<typeof GenericWallet>);
    fromNew(obj: IFromNew): Promise<this>;
    getBalance(): Promise<{
        result: {
            confirmedBalance: number;
            unconfirmedBalance: any;
        };
    }>;
    protected _cashOut(balance: number): Promise<void>;
}
