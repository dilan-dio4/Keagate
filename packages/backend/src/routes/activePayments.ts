import { Static, Type } from '@sinclair/typebox';
import { FastifyInstance, RouteShorthandOptions } from 'fastify';
import { MongoPayment, ForRequest } from '../types';
import auth from '../middlewares/auth';
import context from '../context';
import { MongoTypeForRequest, cleanDetails, AdminRouteHeaders } from './types';

const ActivePaymentsResponse = Type.Array(MongoTypeForRequest, { description: 'Successful response of array of all active payments' });

const opts: RouteShorthandOptions = {
    schema: {
        response: {
            200: ActivePaymentsResponse,
        },
        headers: AdminRouteHeaders,
        tags: ['Payment'],
        description: 'Fetch an array of all active payments. Payments that have been completed or expired will not appear here.',
        summary: 'Fetch an array of all active payments',
        security: [
            {
                ApiKey: [],
            },
        ],
    },
    preHandler: auth,
};

export default async function createActivePaymentsRoute(server: FastifyInstance) {
    server.get<{ Reply: Static<typeof ActivePaymentsResponse> }>('/activePayments', opts, async (request, reply) => {
        await context.initActivePayments();
        const cleanedTransactions: ForRequest<MongoPayment>[] = Object.values(context.activePayments).map((ele) => cleanDetails(ele.getDetails()));
        reply.status(200).send(cleanedTransactions);
    });
}
