import { Static, Type } from '@sinclair/typebox';
import { FastifyInstance, RouteShorthandOptions } from 'fastify';
import auth from '../middlewares/auth';
import mongoGenerator from '../mongo/generator';
import { ObjectId } from 'mongodb';
import { encrypt } from '../utils';

const PaymentStatusResponse = Type.Object({
    publicKey: Type.String(),
    // privateKey: Type.String(),
    amount: Type.Number(),
    amountPaid: Type.Number(),
    expiresAt: Type.String(),
    createdAt: Type.String(),
    updatedAt: Type.String(),
    status: Type.String(),
    id: Type.String(),
    ipnCallbackUrl: Type.Optional(Type.String({ format: 'uri' })),
    invoiceCallbackUrl: Type.Optional(Type.String({ format: 'uri' })),
    payoutTransactionHash: Type.Optional(Type.String()),
    invoiceUrl: Type.String(),
    currency: Type.String(),
});

const PaymentStatusQueryString = Type.Object({
    id: Type.String(),
});

const opts: RouteShorthandOptions = {
    schema: {
        response: {
            300: Type.String(),
            200: PaymentStatusResponse,
        },
        querystring: PaymentStatusQueryString,
    },
    preHandler: auth,
};

export default function createPaymentStatusRoute(server: FastifyInstance) {
    server.get<{
        Reply: Static<typeof PaymentStatusResponse> | string;
        Querystring: Static<typeof PaymentStatusQueryString>;
    }>('/getPaymentStatus', opts, async (request, reply) => {
        const id = request.query.id;
        const { db } = await mongoGenerator();
        const selectedPayment = (await db.collection('payments').findOne({ _id: new ObjectId(id) })) as (Record<string, any> & { _id: ObjectId }) | null;
        if (!selectedPayment) {
            return reply.status(300).send('No payment found with given id');
        }
        delete selectedPayment['privateKey'];
        selectedPayment.id = selectedPayment._id.toString();
        delete selectedPayment._id;
        delete selectedPayment.type;
        selectedPayment.createdAt = selectedPayment.createdAt.toISOString();
        selectedPayment.updatedAt = selectedPayment.updatedAt.toISOString();
        selectedPayment.expiresAt = selectedPayment.expiresAt.toISOString();
        selectedPayment.invoiceUrl = `/invoice/${selectedPayment.currency}/${encrypt(selectedPayment.id)}`;
        reply.status(200).send(selectedPayment);
    });
}
