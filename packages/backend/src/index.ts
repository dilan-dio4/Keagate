import dotenvDefaultConfig from "./dotenvDefaults";
import path from 'path';
dotenvDefaultConfig({ 
    path: path.join(__dirname, '..', '..', '..', '.env'),
    defaults: path.join(__dirname, '..', '..', '..', '.env.default')
})
import fastify from 'fastify';
import { AvailableTickers, currencies } from "@snow/common/src";
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

for (const k of Object.keys(currencies)) {
    const _currency = k as AvailableTickers;
    const coinName = currencies[_currency].name;
    const publicKey = process.env[`ADMIN_${_currency.toUpperCase()}_PUBLIC_KEY`];
    const privateKey = process.env[`ADMIN_${_currency.toUpperCase()}_PRIVATE_KEY`];

    if (!publicKey || !privateKey) {
        console.error(`No admin public key and private key found for currency ${_currency}`);
        continue;
    }

    const params = [publicKey, privateKey] as const;
    let currentClient: GenericAdminWallet;
    if (currenciesToWallets[_currency]) {
        currentClient = new currenciesToWallets[_currency].Admin(...params);
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
    }, +process.env.TRANSACTION_REFRESH_TIME!)
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
        if (currenciesToWallets[_currActiveTransaction.currency]) {
            activePayments[_currActiveTransaction._id.toString()] = new currenciesToWallets[_currActiveTransaction.currency as AvailableTickers].Transactional(id => delete activePayments[id]).fromManual({
                ..._currActiveTransaction as any,
                id: _currActiveTransaction._id.toString()
            })
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
