import { Static, Type } from '@sinclair/typebox';
import { FastifyInstance, RouteShorthandOptions } from 'fastify';
import auth from '../middlewares/auth';
import GenericTransactionalWallet from '../transactionalWallets/GenericTransactionalWallet';
import { AvailableCurrencies } from '@keagate/common/src';
import TransactionalCoinlibWrapper from '../transactionalWallets/coinlib/TransactionalCoinlibWrapper';
import { walletIndexGenerator } from '../transactionalWallets/coinlib/trxLimits';
import context from '../context';
import { currencyDusts } from '../transactionalWallets/coinlib/trxLimits';
import { cleanDetails, MongoTypeForRequest } from './types';

const CreatePaymentBody = Type.Object({
    currency: Type.String(),
    amount: Type.Number({ minimum: 0 }),
    ipnCallbackUrl: Type.Optional(Type.String({ format: 'uri' })),
    invoiceCallbackUrl: Type.Optional(Type.String({ format: 'uri' })),
    extraId: Type.Optional(Type.Union([Type.String(), Type.Number()])),
});

const opts: RouteShorthandOptions = {
    schema: {
        body: CreatePaymentBody,
        response: {
            200: MongoTypeForRequest,
            300: Type.String()
        },
    },
    preHandler: auth,
};

export default function createPaymentRoute(server: FastifyInstance) {
    server.post<{ Body: Static<typeof CreatePaymentBody>; Reply: Static<typeof MongoTypeForRequest> | string }>('/createPayment', opts, async (request, reply) => {
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
            if (currencyDusts[createCurrency] >= body.amount) {
                reply.status(300).send(`Transaction amount is lower than the minimum for ${createCurrency}: ${currencyDusts[createCurrency]} dust`);
                return;
            }
            transactionalWallet = await new TransactionalCoinlibWrapper().fromNew(transactionalWalletNewObj, {
                onDie: (id) => delete context.activePayments[id],
                currency: createCurrency,
                walletIndex: walletIndexGenerator[createCurrency](),
                coinlibPayment: context.coinlibCurrencyToClient[createCurrency]
            });
        } else {
            console.error(`No transactional wallet found/enabled for currency ${body.currency}`);
            return;
        }

        context.activePayments[transactionalWallet.getDetails().id] = transactionalWallet;
        reply.status(200).send(cleanDetails(transactionalWallet.getDetails()));
    });
}
