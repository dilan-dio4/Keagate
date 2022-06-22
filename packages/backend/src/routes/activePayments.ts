import { Static, Type } from '@sinclair/typebox';
import { FastifyInstance, RouteShorthandOptions } from "fastify";
import { RequestPayment } from '../types';
import auth from "../middlewares/auth";
import TransactionalSolana from '../transactionalWallets/Solana';

const ActivePaymentsResponse = Type.Array(Type.Object({
    publicKey: Type.String(),
    // privateKey: Type.String(),
    amount: Type.Number(),
    expiresAt: Type.String(),
    createdAt: Type.String(),
    updatedAt: Type.String(),
    status: Type.String(),
    id: Type.String(),
    ipnCallbackUrl: Type.Optional(Type.String()),
    invoiceCallbackUrl: Type.Optional(Type.String()),
    payoutTransactionHash: Type.Optional(Type.String())
}))

const opts: RouteShorthandOptions = {
    schema: {
        response: {
            200: ActivePaymentsResponse
        }
    },
    preHandler: auth
}

export default function createActivePaymentsRoute(server: FastifyInstance, activePayments: Record<string, TransactionalSolana>) {
    server.get<{ Reply: Static<typeof ActivePaymentsResponse> }>(
        '/activePayments',
        opts,
        async (request, reply) => {
            const cleanedTransactions: RequestPayment[] = [];
            Object.values(activePayments).forEach(ele => {
                const details: Record<string, any> = { ...ele.getDetails() };
                delete details['privateKey'];
                cleanedTransactions.push({
                    ...details as any,
                    createdAt: details.createdAt.toISOString(),
                    updatedAt: details.updatedAt.toISOString(),
                    expiresAt: details.expiresAt.toISOString(),
                });
            })
            reply.status(200).send(cleanedTransactions);
        }
    )
}