import { AvailableTickers, AvailableCoins, PaymentStatusType } from "@snow/common/src";
import { ClassPayment, IFromNew } from "../types";
export default abstract class GenericWallet {
    onDie: (id: string) => any;
    currency: AvailableTickers;
    coinName: AvailableCoins;
    protected _initialized: boolean;
    protected publicKey: string;
    protected privateKey: string;
    protected amount: number;
    protected amountPaid: number;
    protected expiresAt: Date;
    protected createdAt: Date;
    protected updatedAt: Date;
    protected status: PaymentStatusType;
    protected id: string;
    protected ipnCallbackUrl?: string;
    protected invoiceCallbackUrl?: string;
    protected payoutTransactionHash?: string;
    constructor(onDie: (id: string) => any);
    protected abstract _cashOut(balance: number): Promise<void>;
    abstract getBalance(): Promise<{
        result: {
            confirmedBalance: number;
            unconfirmedBalance?: number;
        };
    }>;
    abstract fromNew(obj: IFromNew): Promise<this>;
    fromPublicKey(publicKey: string | Uint8Array): Promise<this>;
    fromPaymentId(paymentId: string): Promise<this>;
    fromManual(initObj: ClassPayment): this;
    protected _initInDatabase(obj: IFromNew & {
        publicKey: string;
        privateKey: string;
    }): Promise<this>;
    private _setFromObject;
    getKeypair(): {
        publicKey: string;
        privateKey: string;
    };
    getDetails(): ClassPayment;
    checkTransaction(): Promise<void>;
    protected _updateStatus(update: Partial<ClassPayment>, error?: string): Promise<void>;
}
