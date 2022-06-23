import config from './config';
import fastify from 'fastify';
import { AvailableCurrencies, currencies } from "@snow/common/src";
import idsToProviders from "@snow/api-providers/src";
import GenericAdminWallet from "./adminWallets/GenericAdminWallet";
import auth from './middlewares/auth';
import mongoGenerator from "./mongoGenerator";
import createPaymentRoute from './routes/createPayment';
import createActivePaymentsRoute from './routes/activePayments';
import createPaymentStatusRoute from './routes/paymentStatus';
import createInvoiceClientRoute from "./routes/invoiceClient";
import createInvoiceStatusRoute from './routes/invoiceStatus';
import GenericTransactionalWallet from "./transactionalWallets/GenericTransactionalWallet";
import currenciesToWallets from "./currenciesToWallets";

const server = fastify({
    trustProxy: true,
    ajv: {
        customOptions: {
            strict: 'log',
            keywords: ['kind', 'modifier'],
        }
    }
});

const activePayments: Record<string, GenericTransactionalWallet> = {};

const enabledCurrencies = Object.keys(currencies).filter(ele => !!config.has(ele) && !!config.getTyped(ele as AvailableCurrencies).ADMIN_PUBLIC_KEY) as AvailableCurrencies[];

for (const _currency of enabledCurrencies) {
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
        config.getTyped(_currency).PROVIDER ? new idsToProviders[config.getTyped(_currency).PROVIDER](config.getTyped(_currency).PROVIDER_PARAMS) : undefined
    ] as const;

    let currentClient: GenericAdminWallet;
    if (currenciesToWallets[_currency]) {
        currentClient = new currenciesToWallets[_currency].Admin(...adminWalletParams);
    } else {
        console.error(`No admin wallet found for currency ${_currency}`);
        continue;
    }

    server.get(`/get${coinName}Balance`, { preHandler: auth }, (request, reply) => currentClient.getBalance());
    server.post<{ Body: Record<string, any> }>(`/send${coinName}Transaction`, { preHandler: auth }, (request, reply) => currentClient.sendTransaction(request.body.destination, request.body.amount));
}

function transactionIntervalRunner() {
    setInterval(() => {
        console.log("Checking payments...");
        Object.values(activePayments).forEach(ele => ele.checkTransaction());
    }, config.getTyped('TRANSACTION_REFRESH_TIME'))
}

createInvoiceClientRoute(server);
createInvoiceStatusRoute(server);
createPaymentRoute(server, activePayments);
createActivePaymentsRoute(server, activePayments);
createPaymentStatusRoute(server);

async function init() {
    const { db } = await mongoGenerator();
    const _activeTransactions = await db.collection('payments').find({ status: { $nin: ["FINISHED", "EXPIRED", "FAILED"] } }).toArray();
    for (const _currActiveTransaction of _activeTransactions) {
        const currTxCurrency = _currActiveTransaction.currency as AvailableCurrencies;
        if (currenciesToWallets[currTxCurrency]) {
            const params = [
                id => delete activePayments[id],
                config.getTyped(currTxCurrency).PROVIDER ? new idsToProviders[config.getTyped(currTxCurrency).PROVIDER](config.getTyped(currTxCurrency).PROVIDER_PARAMS) : undefined
            ] as const;

            activePayments[_currActiveTransaction._id.toString()] = new currenciesToWallets[currTxCurrency].Transactional(...params).fromManual({
                ..._currActiveTransaction as any,
                id: _currActiveTransaction._id.toString()
            });
        } else {
            console.error(`No transactional wallet found for currency ${_currActiveTransaction.currency}`);
            continue;
        }
    }
    transactionIntervalRunner();
    server.listen({ port: 8081 }, (err, address) => {
        if (err) {
            console.error(err)
            process.exit(1)
        }
        console.log(`Server listening at ${address}`);
    });
}

init();
