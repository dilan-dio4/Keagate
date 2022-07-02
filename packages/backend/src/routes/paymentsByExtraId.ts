import { Static, Type } from '@sinclair/typebox';
import { FastifyInstance, RouteShorthandOptions } from 'fastify';
import auth from '../middlewares/auth';
import mongoGenerator from '../mongo/generator';
import { WithId } from 'mongodb';
import { MongoTypeForRequest, cleanDetails, AdminRouteHeaders } from './types';
import { ForRequest, MongoPayment } from '../types';

const PaymentsByExtraIdResponse = Type.Array(MongoTypeForRequest);

const PaymentsByExtraIdQueryString = Type.Object({
    extraId: Type.String({
        description: `The extraId of an existing payment`
    }),
});

const opts: RouteShorthandOptions = {
    schema: {
        response: {
            200: PaymentsByExtraIdResponse,
        },
        querystring: PaymentsByExtraIdQueryString,
        headers: AdminRouteHeaders,
        tags: ['Payment'],
        description: 'Fetch an array of all payments by *extraId*. All payments by this query will appear here.',
        summary: 'Fetch an array of all payments by extraId',
        security:[
            {
                ApiKey: []
            }
        ]
    },
    preHandler: auth,
};

export default async function createPaymentStatusRoute(server: FastifyInstance) {
    server.get<{
        Reply: Static<typeof PaymentsByExtraIdResponse> | string;
        Querystring: Static<typeof PaymentsByExtraIdQueryString>;
    }>('/getPaymentsByExtraId', opts, async (request, reply) => {
        const extraId = request.query.extraId;
        const { db } = await mongoGenerator();
        const selectedPayments = (await db.collection('payments').find({ extraId }).toArray()) as (WithId<MongoPayment>)[];
        const cleanedTransactions: ForRequest<MongoPayment>[] = selectedPayments.map(ele => cleanDetails(ele));
        reply.status(200).send(cleanedTransactions);
    });
}
