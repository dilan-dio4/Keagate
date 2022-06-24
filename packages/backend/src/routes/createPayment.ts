import { Static, Type } from '@sinclair/typebox';
import { FastifyInstance, RouteShorthandOptions } from "fastify";
import auth from "../middlewares/auth";
import GenericTransactionalWallet from "../transactionalWallets/GenericTransactionalWallet";
import { encrypt } from "../utils";
import currenciesToWallets from "../currenciesToWallets";
import { AvailableCurrencies } from "@snow/common/src";
import config from "config";
import idsToProviders from "@snow/api-providers/src";

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

export default function createPaymentRoute(server: FastifyInstance, activePayments: Record<string, GenericTransactionalWallet>) {
    server.post<{ Body: Static<typeof CreatePaymentBody>; Reply: Static<typeof CreatePaymentResponse> }>(
        '/createPayment',
        opts,
        async (request, reply) => {
            const { body } = request;

            const currency = body.currency.toLowerCase() as AvailableCurrencies;
            let transactionalWallet: GenericTransactionalWallet;
            if (currenciesToWallets[currency]) {
                const params = [
                    id => delete activePayments[id],
                    config.getTyped(currency).PROVIDER ? new idsToProviders[config.getTyped(currency).PROVIDER](config.getTyped(currency).PROVIDER_PARAMS) : undefined,
                    currenciesToWallets[currency].Admin
                ] as const;
    
                transactionalWallet = await new currenciesToWallets[currency].Transactional(...params).fromNew({
                    amount: body.amount,
                    invoiceCallbackUrl: body.invoiceCallbackUrl,
                    ipnCallbackUrl: body.ipnCallbackUrl
                });
            } else {
                console.error(`No transactional wallet found for currency ${body.currency}`);
                return;
            }

            const newWalletDetails: any = { ...transactionalWallet.getDetails() };
            activePayments[newWalletDetails.id] = transactionalWallet;
            delete newWalletDetails.privateKey;
            delete newWalletDetails.payoutTransactionHash;
            newWalletDetails.invoiceUrl = `/invoice/${newWalletDetails.currency}/${encrypt(newWalletDetails.id)}`
            reply.status(200).send(newWalletDetails);
        }
    )
}