import { Type } from '@sinclair/typebox';
import { WithId } from 'mongodb';
import { ForRequest, MongoPayment } from '../types';
import { encrypt } from '../utils';

export const MongoTypeForRequest = Type.Object({
    publicKey: Type.String(),
    amount: Type.Number(),
    expiresAt: Type.String(),
    createdAt: Type.String(),
    updatedAt: Type.String(),
    status: Type.String(),
    id: Type.String(),
    extraId: Type.Optional(Type.Union([Type.String(), Type.Number()])),
    ipnCallbackUrl: Type.Optional(Type.String({ format: 'uri' })),
    invoiceCallbackUrl: Type.Optional(Type.String({ format: 'uri' })),
    payoutTransactionHash: Type.Optional(Type.String()),
    invoiceUrl: Type.String(),
    currency: Type.String(),
    walletIndex: Type.Optional(Type.Number()),
})

export function cleanDetails(details: MongoPayment | WithId<Omit<MongoPayment, "id">>): ForRequest<MongoPayment> {
    const id = (details as any).id ? (details as MongoPayment).id : (details as WithId<Omit<MongoPayment, "id">>)._id.toString();
    return {
        publicKey: details.publicKey,
        amount: details.amount,
        expiresAt: details.expiresAt.toISOString(),
        createdAt: details.createdAt.toISOString(),
        updatedAt: details.updatedAt.toISOString(),
        status: details.status,
        id,
        extraId: details.extraId,
        ipnCallbackUrl: details.ipnCallbackUrl,
        invoiceCallbackUrl: details.invoiceCallbackUrl,
        payoutTransactionHash: details.payoutTransactionHash,
        invoiceUrl: `/invoice/${details.currency}/${encrypt(id)}`,
        currency: details.currency,
        ...({ walletIndex: (details as any).walletIndex } as any)
    }
}