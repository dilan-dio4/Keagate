import { AvailableCurrencies, PaymentStatusType } from '@snow/common/src'

interface PaymentRoot {
    amount: number
    amountPaid: number
    status: PaymentStatusType
    id: string
    ipnCallbackUrl?: string
    invoiceCallbackUrl?: string
    payoutTransactionHash?: string
    currency: AvailableCurrencies
    publicKey: string
    expiresAt: Date
    createdAt: Date
    updatedAt: Date
}

export interface NativePayment extends PaymentRoot {
    privateKey: string
    type: "native"

}

export interface CoinlibPayment extends PaymentRoot {
    type: "coinlib"
    walletIndex: number
}

export type ForRequest<T> = Omit<T, "expiresAt" | "createdAt" | "updatedAt"> & {
    expiresAt: string
    createdAt: string
    updatedAt: string
}

export type MongoPayment = CoinlibPayment | NativePayment

export interface IFromNew {
    amount: number
    ipnCallbackUrl?: string
    invoiceCallbackUrl: string
}
