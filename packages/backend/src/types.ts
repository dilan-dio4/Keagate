import { AvailableCurrencies, PaymentStatusType } from '@keagate/common';

// Inherited from all payment types
interface PaymentRoot {
    amount: number;
    amountPaid: number;
    status: PaymentStatusType;
    id: string;
    extraId?: string;
    ipnCallbackUrl?: string;
    invoiceCallbackUrl?: string;
    payoutTransactionHash?: string;
    currency: AvailableCurrencies;
    publicKey: string;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

// Native specific
export interface NativePayment extends PaymentRoot {
    privateKey: string;
    type: 'native';
}

// Coinlib specific
export interface CoinlibPayment extends PaymentRoot {
    type: 'coinlib';
    walletIndex: number;
    memo?: string;
}

// Helpers
export type ForRequest<T> = Omit<T, 'expiresAt' | 'createdAt' | 'updatedAt'> & {
    expiresAt: string;
    createdAt: string;
    updatedAt: string;
    invoiceUrl: string;
};

export type MongoPayment = CoinlibPayment | NativePayment;

export interface IFromNew {
    amount: number;
    ipnCallbackUrl?: string;
    invoiceCallbackUrl: string;
    extraId?: string;
}

export interface INativeInitInDatabase extends IFromNew {
    publicKey: string;
    privateKey: string;
}

export interface ICoinlibInitInDatabase extends IFromNew {
    publicKey: string;
    walletIndex: number;
    memo?: string;
}
