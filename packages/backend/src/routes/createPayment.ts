import { Static, Type } from '@sinclair/typebox';
import { FastifyInstance, RouteShorthandOptions } from "fastify";
import auth from "../middlewares/auth";
import TransactionalSolana from '../transactionalWallets/Solana';
import { encrypt } from "../utils";

const CreatePaymentBody = Type.Object({
    currency: Type.String(),
    amount: Type.Number({ minimum: 0 }),
    ipnCallbackUrl: Type.Optional(Type.String({ format: "uri" })),
    invoiceCallbackUrl: Type.Optional(Type.String({ format: "uri" }))
})

const CreatePaymentResponse = Type.Object({
    publicKey: Type.String(),
    amount: Type.Number(),
    expiresAt: Type.String(),
    createdAt: Type.String(),
    updatedAt: Type.String(),
    status: Type.String(),
    id: Type.String(),
    ipnCallbackUrl: Type.Optional(Type.String({ format: "uri" })),
    invoiceCallbackUrl: Type.Optional(Type.String({ format: "uri" })),
    invoiceUrl: Type.String({ format: "uri" }),
    currency: Type.String()
});

const opts: RouteShorthandOptions = {
    schema: {
        body: CreatePaymentBody,
        response: {
            200: CreatePaymentResponse
        }
    },
    preHandler: auth
}

export default function createPaymentRoute(server: FastifyInstance, activePayments: Record<string, TransactionalSolana>) {
    server.post<{ Body: Static<typeof CreatePaymentBody>; Reply: Static<typeof CreatePaymentResponse> }>(
        '/createPayment',
        opts,
        async (request, reply) => {
            const { body } = request;
            // Create wallet
            const newWallet = await new TransactionalSolana((id) => delete activePayments[id]).fromNew({
                amount: body.amount,
                invoiceCallbackUrl: body.invoiceCallbackUrl,
                ipnCallbackUrl: body.ipnCallbackUrl
            });
            const newWalletDetails: any = { ...newWallet.getDetails() };
            activePayments[newWalletDetails.id] = newWallet;
            delete newWalletDetails.privateKey;
            delete newWalletDetails.payoutTransactionHash;
            newWalletDetails.invoiceUrl = `/invoice/${newWalletDetails.currency}/${encrypt(newWalletDetails.id)}`
            reply.status(200).send(newWalletDetails);
        }
    )
}