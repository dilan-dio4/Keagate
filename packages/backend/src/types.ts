import { AvailableCurrencies, PaymentStatusType } from '@snow/common/src';

interface PaymentRoot {
    amount: number;
    amountPaid: number;
    status: PaymentStatusType;
    id: string;
    ipnCallbackUrl?: string;
    invoiceCallbackUrl?: string;
    payoutTransactionHash?: string;
    currency: AvailableCurrencies;
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

export interface IFromNew {
    amount: number;
    ipnCallbackUrl?: string;
    invoiceCallbackUrl: string;
}

// https://stackoverflow.com/a/66702014
export type ConcreteConstructor<T extends abstract new (...args: any) => any> =
    (T extends abstract new (...args: infer A) => infer R ?
        new (...args: A) => R : never) & T;

