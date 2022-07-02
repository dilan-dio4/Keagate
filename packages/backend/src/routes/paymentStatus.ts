import { Static, Type } from '@sinclair/typebox';
import { FastifyInstance, RouteShorthandOptions } from 'fastify';
import auth from '../middlewares/auth';
import mongoGenerator from '../mongo/generator';
import { ObjectId, WithId } from 'mongodb';
import { MongoTypeForRequest, cleanDetails, AdminRouteHeaders, ErrorResponse } from './types';

const PaymentStatusQueryString = Type.Object({
    id: Type.String(),
});

const opts: RouteShorthandOptions = {
    schema: {
        response: {
            300: ErrorResponse,
            200: MongoTypeForRequest,
        },
        querystring: PaymentStatusQueryString,
        headers: AdminRouteHeaders
    },
    preHandler: auth,
};

export default async function createPaymentStatusRoute(server: FastifyInstance) {
    server.get<{
        Reply: Static<typeof MongoTypeForRequest> | Static<typeof ErrorResponse>;
        Querystring: Static<typeof PaymentStatusQueryString>;
    }>('/getPaymentStatus', opts, async (request, reply) => {
        const id = request.query.id;
        const { db } = await mongoGenerator();
        const selectedPayment = (await db.collection('payments').findOne({ _id: new ObjectId(id) })) as WithId<Record<string, any>> | null;
        if (!selectedPayment) {
            return reply.status(300).send({ error: 'No payment found with given id' });
        }
        reply.status(200).send(cleanDetails(selectedPayment as any));
    });
}
