import { Type } from '@sinclair/typebox';
import { WithId } from 'mongodb';
import { ForRequest, MongoPayment } from '../types';
import { encrypt } from '../utils';

export const MongoTypeForRequest = Type.Object({
    publicKey: Type.String(),
    amount: Type.Number(),
    amountPaid: Type.Number(),
    expiresAt: Type.String(),
    createdAt: Type.String(),
    updatedAt: Type.String(),
    status: Type.String(),
    id: Type.String(),
    extraId: Type.Optional(Type.String()),
    ipnCallbackUrl: Type.Optional(Type.String({ format: 'uri' })),
    invoiceCallbackUrl: Type.Optional(Type.String({ format: 'uri' })),
    payoutTransactionHash: Type.Optional(Type.String()),
    invoiceUrl: Type.String(),
    currency: Type.String(),
    walletIndex: Type.Optional(Type.Number()),
    memo: Type.Optional(Type.String()),
})

export function cleanDetails(details: MongoPayment | WithId<Omit<MongoPayment, "id">>): ForRequest<MongoPayment> {
    const id = "id" in details ? details.id : details._id.toString();

    return {
        publicKey: details.publicKey,
        amount: details.amount,
        expiresAt: typeof details.expiresAt === "string" ? details.expiresAt : details.expiresAt.toISOString(),
        createdAt: typeof details.createdAt === "string" ? details.createdAt : details.createdAt.toISOString(),
        updatedAt: typeof details.updatedAt === "string" ? details.updatedAt : details.updatedAt.toISOString(),
        status: details.status,
        id,
        extraId: details.extraId,
        ipnCallbackUrl: details.ipnCallbackUrl,
        invoiceCallbackUrl: details.invoiceCallbackUrl,
        payoutTransactionHash: details.payoutTransactionHash,
        invoiceUrl: `/invoice/${details.currency}/${encrypt(id)}`,
        currency: details.currency,
        amountPaid: details.amountPaid,
        ...({
            walletIndex: "walletIndex" in details ? details.walletIndex : undefined,
            memo: "memo" in details ? details.memo : undefined,
        } as any)
    }
}

export const AdminRouteHeaders = Type.Object({
    KEAGATE_API_KEY: Type.String()
})

export const ErrorResponse = Type.Object({
    error: Type.Optional(Type.String())
})
