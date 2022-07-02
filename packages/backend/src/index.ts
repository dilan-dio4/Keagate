import config from './config';
import fastify from 'fastify';
import { currencies, availableCoinlibCurrencies, availableNativeCurrencies } from '@keagate/common/src';
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
    server.listen({ port: 8081 }, (err, address) => {
        if (err) {
            console.error(err);
            process.exit(1);
        }
        console.log(`Server listening at ${address}`);
    });
}

main();
