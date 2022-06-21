import { AvailableTickers } from './currencies';

export const paymentStatuses = ["WAITING", "CONFIRMING", "CONFIRMED", "SENDING", "FINISHED", "PARTIALLY_PAID", "FAILED", "EXPIRED"] as const;
export type PaymentStatusType = typeof paymentStatuses[number];

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
