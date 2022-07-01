import { Static, Type } from '@sinclair/typebox';
import { FastifyInstance, RouteShorthandOptions } from 'fastify';
import auth from '../middlewares/auth';
import mongoGenerator from '../mongo/generator';
import { WithId } from 'mongodb';
import { MongoTypeForRequest, cleanDetails, AdminRouteHeaders } from './types';
import { ForRequest, MongoPayment } from '../types';

const PaymentsByExtraIdResponse = Type.Array(MongoTypeForRequest);

const PaymentsByExtraIdQueryString = Type.Object({
    extraId: Type.String(),
});

const opts: RouteShorthandOptions = {
    schema: {
        response: {
            300: Type.String(),
            200: PaymentsByExtraIdResponse,
        },
        querystring: PaymentsByExtraIdQueryString,
        headers: AdminRouteHeaders
    },
    preHandler: auth,
};

export default function createPaymentStatusRoute(server: FastifyInstance) {
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
