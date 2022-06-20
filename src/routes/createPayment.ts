import { Static, Type } from '@sinclair/typebox';
import { FastifyInstance, RouteShorthandOptions } from "fastify";
import currencies from "../currencies";
import mongoGenerator from '../mongoGenerator';
import dayjs from 'dayjs';
import { StringUnion } from '../types';

const CreatePaymentBody = Type.Object({
    currency: Type.Enum(StringUnion(Object.keys(currencies))),
    amount: Type.Number({ minimum: 0 }),
    callbackUrl: Type.Optional(Type.String({ format: "uri" }))
})

const CreatePaymentResponse = Type.Object({
    currency: Type.Enum(StringUnion(Object.keys(currencies))),
    amount: Type.Number({ minimum: 0 }),
    id: Type.String(),
    address: Type.String()
})

const opts: RouteShorthandOptions = {
    schema: {
        body: CreatePaymentBody,
        response: CreatePaymentResponse
    }
}

export default function createPaymentRoute(server: FastifyInstance) {
    server.post<{ Body: Static<typeof CreatePaymentBody>; Reply: Static<typeof CreatePaymentResponse> }>(
        '/createPayment',
        opts,
        async (request, reply) => {
            const { body } = request;
            const { db } = await mongoGenerator();
            // Create wallet
            const { insertedId } = await db.collection('transactions').insertOne({
                currency: body.currency,
                amount: body.amount,
                expiresAt: dayjs().unix() + process.env.TRANSACTION_TIMEOUT,
                status: "WAITING"
            });
            reply.status(200).send();
        }
    )
}