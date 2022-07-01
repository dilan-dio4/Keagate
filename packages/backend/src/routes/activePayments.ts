import { Static, Type } from '@sinclair/typebox';
import { FastifyInstance, RouteShorthandOptions } from 'fastify';
import { MongoPayment, ForRequest } from '../types';
import auth from '../middlewares/auth';
import context from '../context';
import { MongoTypeForRequest, cleanDetails } from './types';

const ActivePaymentsResponse = Type.Array(MongoTypeForRequest);

const opts: RouteShorthandOptions = {
    schema: {
        response: {
            200: ActivePaymentsResponse,
        },
    },
    preHandler: auth,
};

export default function createActivePaymentsRoute(server: FastifyInstance) {
    server.get<{ Reply: Static<typeof ActivePaymentsResponse> }>('/activePayments', opts, async (request, reply) => {
        const cleanedTransactions: ForRequest<MongoPayment>[] = Object.values(context.activePayments).map(ele => cleanDetails(ele.getDetails()));
        reply.status(200).send(cleanedTransactions);
    });
}
