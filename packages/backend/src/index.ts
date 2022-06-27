import config from './config';
import fastify from 'fastify';
import { currencies } from '@snow/common/src';
import idsToProviders from '@snow/api-providers/src';
import GenericAdminWallet from './adminWallets/GenericAdminWallet';
import auth from './middlewares/auth';
import createPaymentRoute from './routes/createPayment';
import createActivePaymentsRoute from './routes/activePayments';
import createPaymentStatusRoute from './routes/paymentStatus';
import createInvoiceClientRoute from './routes/invoiceClient';
import createInvoiceStatusRoute from './routes/invoiceStatus';
import context from './context';

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
 * Native = currency processed by a wallet built into Snow
 * Coinlib = currency processed by the port of coinlib
 */

async function main() {
    await context.init();

    // Initalize the admin wallet routes for native currencies
    for (const _currency of context.enabledNativeCurrencies) {
        const coinName = currencies[_currency].name;
        const publicKey: string = config.getTyped(_currency).ADMIN_PUBLIC_KEY;
        const privateKey: string = config.getTyped(_currency).ADMIN_PRIVATE_KEY;

        if (!publicKey || !privateKey) {
            console.error(`No admin public key and private key found for currency ${_currency}`);
            continue;
        }

        const adminWalletParams = [
            publicKey,
            privateKey,
            config.getTyped(_currency).PROVIDER
                ? new idsToProviders[config.getTyped(_currency).PROVIDER](config.getTyped(_currency).PROVIDER_PARAMS)
                : undefined,
        ] as const;

        let currentClient: GenericAdminWallet;
        if (context.nativeCurrencyToClient[_currency]) {
            currentClient = new context.nativeCurrencyToClient[_currency].Admin(...adminWalletParams);
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
        const coinName = currencies[_currency].name;
        // TODO
        // server.get(`/get${coinName}Balance`, { preHandler: auth }, (request, reply) => currentClient.getBalance())
        // server.post<{ Body: Record<string, any> }>(`/send${coinName}Transaction`, { preHandler: auth }, (request, reply) =>
        //     currentClient.sendTransaction(request.body.destination, request.body.amount),
        // )
    }

    function paymentsIntervalRunner() {
        setInterval(() => {
            console.log('Checking payments...');
            Object.values(context.activePayments).forEach((ele) => ele.checkTransaction());
        }, config.getTyped('TRANSACTION_REFRESH_TIME'));
    }

    // Create other routes for API and invoice client
    createInvoiceClientRoute(server);
    createInvoiceStatusRoute(server);
    createPaymentRoute(server);
    createActivePaymentsRoute(server);
    createPaymentStatusRoute(server);

    // Start the processing intervals
    paymentsIntervalRunner();

    server.listen({ port: 8081 }, (err, address) => {
        if (err) {
            console.error(err);
            process.exit(1);
        }
        console.log(`Server listening at ${address}`);
    });
}

main();
