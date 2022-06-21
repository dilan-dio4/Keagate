import GenericWallet from '../GenericWallet';
import { AvailableCoins, AvailableTickers } from "../../currencies";
export default class SolanaTransactional extends GenericWallet {
    private connection;
    ticker: AvailableTickers;
    coinName: AvailableCoins;
    static TRANSFER_FEE_LAMPORTS: number;
    constructor(...args: ConstructorParameters<typeof GenericWallet>);
    fromNew(amount: number, callbackUrl?: string): Promise<this>;
    getBalance(): Promise<{
        result: {
            confirmedBalance: number;
            unconfirmedBalance: any;
        };
    }>;
    protected _cashOut(balance: number): Promise<void>;
}
