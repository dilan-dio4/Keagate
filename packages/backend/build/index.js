"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenvDefaults_1 = __importDefault(require("./dotenvDefaults"));
const path_1 = __importDefault(require("path"));
(0, dotenvDefaults_1.default)({
    path: path_1.default.join(__dirname, '..', '..', '..', '.env'),
    defaults: path_1.default.join(__dirname, '..', '..', '..', '.env.default')
});
const fastify_1 = __importDefault(require("fastify"));
const src_1 = require("@snow/common/src");
const auth_1 = __importDefault(require("./middlewares/auth"));
const mongoGenerator_1 = __importDefault(require("./mongoGenerator"));
const createPayment_1 = __importDefault(require("./routes/createPayment"));
const activePayments_1 = __importDefault(require("./routes/activePayments"));
const paymentStatus_1 = __importDefault(require("./routes/paymentStatus"));
const invoiceClient_1 = __importDefault(require("./routes/invoiceClient"));
const invoiceStatus_1 = __importDefault(require("./routes/invoiceStatus"));
const currenciesToWallets_1 = __importDefault(require("./currenciesToWallets"));
const server = (0, fastify_1.default)({
    trustProxy: true,
    ajv: {
        customOptions: {
            strict: 'log',
            keywords: ['kind', 'modifier'],
        }
    }
});
const activePayments = {};
for (const k of Object.keys(src_1.currencies)) {
    const _currency = k;
    const coinName = src_1.currencies[_currency].name;
    const publicKey = process.env[`ADMIN_${_currency.toUpperCase()}_PUBLIC_KEY`];
    const privateKey = process.env[`ADMIN_${_currency.toUpperCase()}_PRIVATE_KEY`];
    if (!publicKey || !privateKey) {
        console.error(`No admin public key and private key found for currency ${_currency}`);
        continue;
    }
    const params = [publicKey, privateKey];
    let currentClient;
    if (currenciesToWallets_1.default[_currency]) {
        currentClient = new currenciesToWallets_1.default[_currency].Admin(...params);
    }
    else {
        console.error(`No admin wallet found for currency ${_currency}`);
        continue;
    }
    server.get(`/get${coinName}Balance`, { preHandler: auth_1.default }, (request, reply) => currentClient.getBalance());
    server.post(`/send${coinName}Transaction`, { preHandler: auth_1.default }, (request, reply) => currentClient.sendTransaction(request.body.destination, request.body.amount));
}
function transactionIntervalRunner() {
    setInterval(() => {
        console.log("Checking payments...");
        Object.values(activePayments).forEach(ele => ele.checkTransaction());
    }, +process.env.TRANSACTION_REFRESH_TIME);
}
(0, invoiceClient_1.default)(server);
(0, invoiceStatus_1.default)(server);
(0, createPayment_1.default)(server, activePayments);
(0, activePayments_1.default)(server, activePayments);
(0, paymentStatus_1.default)(server);
async function init() {
    const { db } = await (0, mongoGenerator_1.default)();
    const _activeTransactions = await db.collection('payments').find({ status: { $nin: ["FINISHED", "EXPIRED", "FAILED"] } }).toArray();
    for (const _currActiveTransaction of _activeTransactions) {
        if (currenciesToWallets_1.default[_currActiveTransaction.currency]) {
            activePayments[_currActiveTransaction._id.toString()] = new currenciesToWallets_1.default[_currActiveTransaction.currency].Transactional(id => delete activePayments[id]).fromManual({
                ..._currActiveTransaction,
                id: _currActiveTransaction._id.toString()
            });
        }
        else {
            console.error(`No transactional wallet found for currency ${_currActiveTransaction.currency}`);
            continue;
        }
    }
    transactionIntervalRunner();
    server.listen({ port: 8081 }, (err, address) => {
        if (err) {
            console.error(err);
            process.exit(1);
        }
        console.log(`Server listening at ${address}`);
    });
}
init();
//# sourceMappingURL=index.js.map