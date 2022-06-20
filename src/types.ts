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
}

export interface DbPayment extends PaymentRoot {
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
    publicKey: string;
    privateKey: string;
}

export interface ClassPayment extends PaymentRoot {
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
    publicKey: Uint8Array;
    privateKey: Uint8Array;
}

export interface RequestPayment extends PaymentRoot {
    publicKey: string;
    privateKey: string;
    expiresAt: string;
    createdAt: string;
    updatedAt: string;
}
