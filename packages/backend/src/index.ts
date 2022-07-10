import config from './config';
import fastify from 'fastify';
import { currencies, availableCoinlibCurrencies, availableNativeCurrencies } from '@keagate/common';
import GenericAdminWallet from './adminWallets/GenericAdminWallet';
import auth from './middlewares/auth';
import createPaymentRoute from './routes/createPayment';
import createActivePaymentsRoute from './routes/activePayments';
import createPaymentStatusRoute from './routes/paymentStatus';
import createInvoiceClientRoute from './routes/invoiceClient';
import createSwaggerRoute from './routes/swagger';
import createInvoiceStatusRoute from './routes/invoiceStatus';
import createPaymentsByExtraIdRoute from './routes/paymentsByExtraId';
import context from './context';
import activityLoop from './activityLoop';
import AdminCoinlibWrapper from './adminWallets/coinlib/AdminCoinlibWrapper';
import crypto from 'crypto';

const server = fastify({
    trustProxy: true,
    ajv: {
        customOptions: {
            strict: 'log',
            keywords: ['kind', 'modifier'],
        },
    },
});

/**
 * Native = currency processed by a wallet built into Keagate
 * Coinlib = currency processed by the port of coinlib
 */

async function main() {
    await context.init();
    server.register(createSwaggerRoute);
    // Initialize the admin wallet routes for native currencies
    for (const _currency of context.enabledNativeCurrencies) {
        const coinName = currencies[_currency].name as typeof availableNativeCurrencies[number];
        const publicKey: string = config.getTyped(_currency).ADMIN_PUBLIC_KEY;
        const privateKey: string = config.getTyped(_currency).ADMIN_PRIVATE_KEY;

        if (!publicKey || !privateKey) {
            console.error(`No admin public key and private key found for currency ${_currency}`);
            continue;
        }

        let currentClient: GenericAdminWallet;
        if (context.nativeCurrencyToClient[_currency]) {
            currentClient = new context.nativeCurrencyToClient[_currency].Admin({
                publicKey,
                privateKey,
            });
        } else {
            console.error(`No admin wallet found for currency ${_currency}`);
            continue;
        }
        // Get the balance of and send a transaction from the admin wallet
        server.get(`/get${coinName}Balance`, { preHandler: auth }, (request, reply) => currentClient.getBalance());
        server.post<{ Body: Record<string, any> }>(`/send${coinName}Transaction`, { preHandler: auth }, (request, reply) =>
            currentClient.sendTransaction(request.body.destination, request.body.amount),
        );
    }

    // Do the same for coinlib currencies
    for (const _currency of context.enabledCoinlibCurrencies) {
        const coinName = currencies[_currency].name as typeof availableCoinlibCurrencies[number];

        const publicKey: string = config.getTyped(_currency).ADMIN_PUBLIC_KEY;
        const privateKey: string = config.getTyped(_currency).ADMIN_PRIVATE_KEY;

        if (!publicKey || !privateKey) {
            console.error(`No admin public key and private key found for currency ${_currency}`);
            continue;
        }

        const currentClient = new AdminCoinlibWrapper({
            currency: _currency,
            privateKey: privateKey,
        });

        server.get(`/get${coinName}Balance`, { preHandler: auth }, (request, reply) => currentClient.getBalance());
        server.post<{ Body: Record<string, any> }>(`/send${coinName}Transaction`, { preHandler: auth }, (request, reply) =>
            currentClient.sendTransaction(request.body.destination, request.body.amount),
        );
    }

    // Create other routes for API and invoice client
    server.register(createInvoiceClientRoute);
    server.register(createInvoiceStatusRoute);
    server.register(createPaymentRoute);
    server.register(createActivePaymentsRoute);
    server.register(createPaymentStatusRoute);
    server.register(createPaymentsByExtraIdRoute);

    // Start the processing intervals
    activityLoop.start();

    await server.ready();
    server.swagger();
    server.listen({ port: config.getTyped('PORT') }, (err, address) => {
        if (err) {
            console.error(err);
            process.exit(1);
        }
        console.log(`Server listening at ${address}`);
    });

    if (config.getTyped('IS_DEV') && config.has('IPN_HMAC_SECRET')) {
        /**
         * For receiving IPN callbacks locally. Never use in production. Ideally, use
         * something like lambda or Azure functions.
         * More information here: https://github.com/dilan-dio4/coinlib-port#instant-payment-notifications
         */
        const ipnConsumer = fastify({
            trustProxy: true,
        });
        ipnConsumer.post<{ Body: Record<string, any> }>('/ipnCallback', (request, reply) => {
            const send = (status: string) => {
                console.log(`[IPN CALLBACK DEV]: ${status}`);
                reply.send(status);
            };
            if (request.headers['x-keagate-sig']) {
                const hmac = crypto.createHmac('sha512', config.getTyped('IPN_HMAC_SECRET'));
                hmac.update(JSON.stringify(request.body, Object.keys(request.body).sort()));
                const signature = hmac.digest('hex');

                if (signature === request.headers['x-keagate-sig']) {
                    send(
                        'x-keagate-sig matches calculated signature. Can authenticate origin and validate message integrity.\n\n' +
                            JSON.stringify(request.body, null, 2),
                    );
                } else {
                    send(
                        `x-keagate-sig header (${request.headers['x-keagate-sig']}) does not match calculated signature (${signature}). Cannot authenticate origin and validate message integrity.` + 
                            JSON.stringify(request.body, null, 2),
                    );
                }
            } else {
                send('No x-keagate-sig found on POST request. Cannot authenticate origin and validate message integrity.');
            }
        });
        ipnConsumer.listen({ port: 8082 }, (err, address) => {
            if (err) {
                console.error(err);
                process.exit(1);
            }
            console.log(`[IPN CALLBACK DEV]: IPN callback server listening at ${address}`);
        });
    }
}

main();
