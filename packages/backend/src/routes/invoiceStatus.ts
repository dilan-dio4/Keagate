import { Static, Type } from '@sinclair/typebox';
import { FastifyInstance, RouteShorthandOptions } from 'fastify';
import { MongoPayment } from '../types';
import mongoGenerator from '../mongo/generator';
import { ObjectId, WithId } from 'mongodb';
import { decrypt } from '../utils';
import { ErrorResponse } from './types';

const InvoiceStatusResponse = Type.Object({
    publicKey: Type.String(),
    amount: Type.Number(),
    amountPaid: Type.Number(),
    expiresAt: Type.String(),
    status: Type.String(),
    currency: Type.String(),
    invoiceCallbackUrl: Type.Optional(Type.String({ format: 'uri' })),
    memo: Type.Optional(Type.String()),
});

const InvoiceStatusQueryString = Type.Object({
    invoiceId: Type.String(),
});

const opts: RouteShorthandOptions = {
    schema: {
        response: {
            200: InvoiceStatusResponse,
            300: ErrorResponse,
        },
        querystring: InvoiceStatusQueryString,
        tags: ['Invoice'],
        description: `Retrieve the status and associated data of an invoice. This is essentially the same as \`/paymentStatus\` except it doesn't 
        return any sensitive payment information and can be safely invoked from clients' machines to build custom payment interfaces`,
        summary: 'Retrieve the status and associated data of an invoice',
    },
};

export default async function createInvoiceStatusRoute(server: FastifyInstance) {
    server.get<{ Reply: Static<typeof InvoiceStatusResponse> | Static<typeof ErrorResponse>; Querystring: Static<typeof InvoiceStatusQueryString> }>(
        '/getInvoiceStatus',
        opts,
        async (request, reply) => {
            const invoiceId = request.query.invoiceId;
            const mongoId = decrypt(invoiceId);
            const { db } = await mongoGenerator();
            const selectedPayment = (await db.collection('payments').findOne({ _id: new ObjectId(mongoId) })) as WithId<MongoPayment>;
            if (!selectedPayment) {
                reply.status(300).send({ error: `No transaction found with given id` });
                return;
            }

            reply.status(200).send({
                publicKey: selectedPayment.publicKey,
                amount: selectedPayment.amount,
                expiresAt: selectedPayment.expiresAt.toISOString(),
                status: selectedPayment.status,
                amountPaid: selectedPayment.amountPaid,
                currency: selectedPayment.currency,
                invoiceCallbackUrl: selectedPayment.invoiceCallbackUrl,
                memo: "memo" in selectedPayment ? selectedPayment.memo : undefined
            });
        },
    );
}
