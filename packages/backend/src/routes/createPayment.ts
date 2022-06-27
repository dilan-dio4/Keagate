import { Static, Type } from '@sinclair/typebox'
import { FastifyInstance, RouteShorthandOptions } from 'fastify'
import auth from '../middlewares/auth'
import GenericTransactionalWallet from '../transactionalWallets/GenericTransactionalWallet'
import { encrypt, randU32Sync } from '../utils'
import { availableCoinlibCurrencies, AvailableCurrencies, availableNativeCurrencies } from '@snow/common/src'
import config from '../config'
import idsToProviders from '@snow/api-providers/src'
import GenericCoinlibWrapper from "../transactionalWallets/coinlib/GenericCoinlibWrapper"
import context from "../context"

const CreatePaymentBody = Type.Object({
    currency: Type.String(),
    amount: Type.Number({ minimum: 0 }),
    ipnCallbackUrl: Type.Optional(Type.String({ format: 'uri' })),
    invoiceCallbackUrl: Type.Optional(Type.String({ format: 'uri' })),
})

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
    type: Type.String()
})

const opts: RouteShorthandOptions = {
    schema: {
        body: CreatePaymentBody,
        response: {
            200: CreatePaymentResponse,
        },
    },
    preHandler: auth,
}

export default function createPaymentRoute(
    server: FastifyInstance,
) {
    server.post<{ Body: Static<typeof CreatePaymentBody>; Reply: Static<typeof CreatePaymentResponse> }>(
        '/createPayment',
        opts,
        async (request, reply) => {
            const { body } = request

            const createCurrency = body.currency.toUpperCase() as AvailableCurrencies
            let transactionalWallet: GenericTransactionalWallet
            const transactionalWalletNewObj = {
                amount: body.amount,
                invoiceCallbackUrl: body.invoiceCallbackUrl,
                ipnCallbackUrl: body.ipnCallbackUrl,
            }
            if (context.enabledNativeCurrencies.includes(createCurrency as any)) {
                const params = [
                    (id) => delete context.activePayments[id],
                    config.getTyped(createCurrency).PROVIDER
                        ? new idsToProviders[config.getTyped(createCurrency).PROVIDER](
                              config.getTyped(createCurrency).PROVIDER_PARAMS,
                          )
                        : undefined,
                    context.nativeCurrencyToClient[createCurrency].Admin,
                ] as const

                transactionalWallet = await new context.nativeCurrencyToClient[createCurrency].Transactional(...params).fromNew(transactionalWalletNewObj)
            } else if (context.enabledCoinlibCurrencies.includes(createCurrency as any)) {
                const params = [
                    (id) => delete context.activePayments[id],
                    context.coinlibCurrencyToClient[createCurrency],
                    randU32Sync()
                ] as const
    
                transactionalWallet = await new GenericCoinlibWrapper(...params).fromNew(transactionalWalletNewObj)
            } else {
                console.error(`No transactional wallet found/enabled for currency ${body.currency}`)
                return
            }

            const newWalletDetails: any = { ...transactionalWallet.getDetails() }
            context.activePayments[newWalletDetails.id] = transactionalWallet
            delete newWalletDetails.payoutTransactionHash
            newWalletDetails.invoiceUrl = `/invoice/${newWalletDetails.currency}/${encrypt(newWalletDetails.id)}`
            reply.status(200).send(newWalletDetails)
        },
    )
}
