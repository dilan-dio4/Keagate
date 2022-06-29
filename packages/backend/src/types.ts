import { AvailableCurrencies, ConcreteConstructor, PaymentStatusType } from '@firagate/common/src';
import { GenericProvider } from '@firagate/api-providers/src';
import GenericAdminWallet from './adminWallets/GenericAdminWallet';

// Inherited from all payment types
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
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

interface PaymentConstructorRoot {
    onDie: (id: string) => any;
}

// Native specific
export interface NativePayment extends PaymentRoot {
    privateKey: string;
    type: 'native';
}

export interface NativePaymentConstructor extends PaymentConstructorRoot {
    apiProvider: GenericProvider;
    adminWalletClass: ConcreteConstructor<typeof GenericAdminWallet>;
}

// Coinlib specific
export interface CoinlibPayment extends PaymentRoot {
    type: 'coinlib';
    walletIndex: number;
}

export interface CoinlibPaymentConstructor extends PaymentConstructorRoot {
    walletIndex: number;
    currency: AvailableCurrencies;
}

// Helpers
export type ForRequest<T> = Omit<T, 'expiresAt' | 'createdAt' | 'updatedAt'> & {
    expiresAt: string;
    createdAt: string;
    updatedAt: string;
};

export type MongoPayment = CoinlibPayment | NativePayment;

export interface IFromNew {
    amount: number;
    ipnCallbackUrl?: string;
    invoiceCallbackUrl: string;
}

export interface INativeInitInDatabase extends IFromNew {
    publicKey: string;
    privateKey: string;
}

export interface ICoinlibInitInDatabase extends IFromNew {
    publicKey: string;
    walletIndex: number;
}