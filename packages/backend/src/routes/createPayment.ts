import { Static, Type } from '@sinclair/typebox';
import { FastifyInstance, RouteShorthandOptions } from 'fastify';
import auth from '../middlewares/auth';
import GenericTransactionalWallet from '../transactionalWallets/GenericTransactionalWallet';
import { AvailableCurrencies, arrayIncludes } from '@keagate/common/src';
import TransactionalCoinlibWrapper from '../transactionalWallets/coinlib/TransactionalCoinlibWrapper';
import { walletIndexGenerator } from '../transactionalWallets/coinlib/trxLimits';
import context from '../context';
import { currencyDusts } from '../transactionalWallets/coinlib/trxLimits';
import { cleanDetails, MongoTypeForRequest, AdminRouteHeaders, ErrorResponse } from './types';
import { IFromNew } from '../types';

const CreatePaymentBody = Type.Pick(MongoTypeForRequest, ['currency', 'amount', 'ipnCallbackUrl', 'invoiceCallbackUrl', 'extraId']);

const opts: RouteShorthandOptions = {
    schema: {
        body: CreatePaymentBody,
        response: {
            200: MongoTypeForRequest,
            300: ErrorResponse,
        },
        headers: AdminRouteHeaders,
        tags: ['Payment'],
        description: 'Create a new payment.',
        summary: 'Create a new payment',
        security: [
            {
                ApiKey: [],
            },
        ],
    },
    preHandler: auth,
};

export default async function createPaymentRoute(server: FastifyInstance) {
    server.post<{ Body: Static<typeof CreatePaymentBody>; Reply: Static<typeof MongoTypeForRequest> | Static<typeof ErrorResponse> }>(
        '/createPayment',
        opts,
        async (request, reply) => {
            const { body } = request;

            const createCurrency = body.currency.toUpperCase() as AvailableCurrencies;
            let transactionalWallet: GenericTransactionalWallet;
            const transactionalWalletNewObj: IFromNew = {
                amount: body.amount,
                invoiceCallbackUrl: body.invoiceCallbackUrl,
                ipnCallbackUrl: body.ipnCallbackUrl,
                extraId: body.extraId,
            };
            if (arrayIncludes(context.enabledNativeCurrencies, createCurrency)) {
                transactionalWallet = await new context.nativeCurrencyToClient[createCurrency].Transactional().fromNew(transactionalWalletNewObj, {
                    onDie: (id) => delete context.activePayments[id],
                    adminWalletClass: context.nativeCurrencyToClient[createCurrency].Admin,
                });
            } else if (arrayIncludes(context.enabledCoinlibCurrencies, createCurrency)) {
                if (createCurrency in currencyDusts && currencyDusts[createCurrency] >= body.amount) {
                    reply
                        .status(300)
                        .send({ error: `Transaction amount is lower than the minimum for ${createCurrency}: ${currencyDusts[createCurrency]} dust` });
                    return;
                }
                transactionalWallet = await new TransactionalCoinlibWrapper().fromNew(transactionalWalletNewObj, {
                    onDie: (id) => delete context.activePayments[id],
                    currency: createCurrency,
                    walletIndex: walletIndexGenerator[createCurrency](),
                    coinlibPayment: context.coinlibCurrencyToClient[createCurrency],
                });
            } else {
                console.error(`No transactional wallet found/enabled for currency ${body.currency}`);
                return;
            }

            context.activePayments[transactionalWallet.getDetails().id] = transactionalWallet;
            reply.status(200).send(cleanDetails(transactionalWallet.getDetails()));
        },
    );
}
