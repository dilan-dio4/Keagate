import { AvailableTickers } from './currencies';
export declare const paymentStatuses: readonly ["WAITING", "CONFIRMING", "CONFIRMED", "SENDING", "FINISHED", "PARTIALLY_PAID", "FAILED", "EXPIRED"];
export declare type PaymentStatusType = typeof paymentStatuses[number];
interface PaymentRoot {
    amount: number;
    status: PaymentStatusType;
    id: string;
    callbackUrl?: string;
    payoutTransactionHash?: string;
    currency: AvailableTickers;
    publicKey: string;
    privateKey: string;
}
export interface ClassPayment extends PaymentRoot {
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface RequestPayment extends PaymentRoot {
    expiresAt: string;
    createdAt: string;
    updatedAt: string;
}
export {};
