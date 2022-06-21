import { AvailableTickers, AvailableCoins } from "../currencies";
import { PaymentStatusType, ClassPayment } from "../types";
export default abstract class GenericWallet {
    onDie: (id: string) => any;
    ticker: AvailableTickers;
    coinName: AvailableCoins;
    protected _initialized: boolean;
    protected publicKey: string;
    protected privateKey: string;
    protected amount: number;
    protected expiresAt: Date;
    protected createdAt: Date;
    protected updatedAt: Date;
    protected status: PaymentStatusType;
    protected id: string;
    protected callbackUrl?: string;
    protected payoutTransactionHash?: string;
    constructor(onDie: (id: string) => any);
    protected abstract _cashOut(balance: number): Promise<void>;
    abstract getBalance(): Promise<{
        result: {
            confirmedBalance: number;
            unconfirmedBalance?: number;
        };
    }>;
    abstract fromNew(amount: number): Promise<this>;
    fromPublicKey(publicKey: string | Uint8Array): Promise<this>;
    fromPaymentId(paymentId: string): Promise<this>;
    fromManual(initObj: ClassPayment): this;
    protected _initInDatabase(publicKey: string, privateKey: string, amount: number, callbackUrl?: string): Promise<this>;
    getKeypair(): {
        publicKey: string;
        privateKey: string;
    };
    getDetails(): ClassPayment;
    checkTransaction(): Promise<void>;
    protected _updateStatus(status: PaymentStatusType, error?: string): Promise<void>;
}
