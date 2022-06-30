import { Static, Type } from '@sinclair/typebox';
import { FastifyInstance, RouteShorthandOptions } from 'fastify';
import auth from '../middlewares/auth';
import GenericTransactionalWallet from '../transactionalWallets/GenericTransactionalWallet';
import { encrypt } from '../utils';
import { AvailableCurrencies } from '@keagate/common/src';
import config from '../config';
import idsToProviders from '@keagate/api-providers/src';
import TransactionalCoinlibWrapper, { walletIndexGenerator } from '../transactionalWallets/coinlib/TransactionalCoinlibWrapper';
import context from '../context';

const CreatePaymentBody = Type.Object({
    currency: Type.String(),
    amount: Type.Number({ minimum: 0 }),
    ipnCallbackUrl: Type.Optional(Type.String({ format: 'uri' })),
    invoiceCallbackUrl: Type.Optional(Type.String({ format: 'uri' })),
});

const CreatePaymentResponse = Type.Object({
    publicKey: Type.String(),
    amount: Type.Number(),
    expiresAt: Type.String(),
    createdAt: Type.String(),
    updatedAt: Type.String(),
    status: Type.String(),
    id: Type.String(),
    ipnCallbackUrl: Type.Optional(Type.String({ format: 'uri' })),
    invoiceCallbackUrl: Type.Optional(Type.String({ format: 'uri' })),
    invoiceUrl: Type.String({ format: 'uri' }),
    currency: Type.String(),
});

const opts: RouteShorthandOptions = {
    schema: {
        body: CreatePaymentBody,
        response: {
            200: CreatePaymentResponse,
        },
    },
    preHandler: auth,
};

export default function createPaymentRoute(server: FastifyInstance) {
    server.post<{ Body: Static<typeof CreatePaymentBody>; Reply: Static<typeof CreatePaymentResponse> }>('/createPayment', opts, async (request, reply) => {
        const { body } = request;

        const createCurrency = body.currency.toUpperCase() as AvailableCurrencies;
        let transactionalWallet: GenericTransactionalWallet;
        const transactionalWalletNewObj = {
            amount: body.amount,
            invoiceCallbackUrl: body.invoiceCallbackUrl,
            ipnCallbackUrl: body.ipnCallbackUrl,
        };
        if (context.enabledNativeCurrencies.includes(createCurrency as any)) {
            transactionalWallet = await new context.nativeCurrencyToClient[createCurrency].Transactional().fromNew(transactionalWalletNewObj, {
                onDie: (id) => delete context.activePayments[id],
                adminWalletClass: context.nativeCurrencyToClient[createCurrency].Admin,
            });
        } else if (context.enabledCoinlibCurrencies.includes(createCurrency as any)) {
            transactionalWallet = await new TransactionalCoinlibWrapper().fromNew(transactionalWalletNewObj, {
                onDie: (id) => delete context.activePayments[id],
                currency: createCurrency,
                walletIndex: walletIndexGenerator[createCurrency](),
            });
        } else {
            console.error(`No transactional wallet found/enabled for currency ${body.currency}`);
            return;
        }

        const newWalletDetails: any = { ...transactionalWallet.getDetails() };
        context.activePayments[newWalletDetails.id] = transactionalWallet;
        delete newWalletDetails.payoutTransactionHash;
        delete newWalletDetails.type;
        newWalletDetails.invoiceUrl = `/invoice/${newWalletDetails.currency}/${encrypt(newWalletDetails.id)}`;
        reply.status(200).send(newWalletDetails);
    });
}
