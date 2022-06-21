"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.join(__dirname, '..', '..', '..', '.env') });
const fastify_1 = __importDefault(require("fastify"));
const currencies_1 = __importDefault(require("./currencies"));
const Dash_1 = __importDefault(require("./adminWallets/Dash"));
const Litecoin_1 = __importDefault(require("./adminWallets/Litecoin"));
const Solana_1 = __importDefault(require("./adminWallets/Solana"));
const Solana_2 = __importDefault(require("./transactionalWallets/Solana"));
const auth_1 = __importDefault(require("./middlewares/auth"));
const mongoGenerator_1 = __importDefault(require("./mongoGenerator"));
const createPayment_1 = __importDefault(require("./routes/createPayment"));
const activePayments_1 = __importDefault(require("./routes/activePayments"));
const paymentStatus_1 = __importDefault(require("./routes/paymentStatus"));
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
let adminDashClient;
let adminLtcClient;
let adminSolClient;
for (const k of Object.keys(currencies_1.default)) {
    const ticker = k;
    const coinName = currencies_1.default[ticker].name;
    const publicKey = process.env[`ADMIN_${ticker.toUpperCase()}_PUBLIC_KEY`];
    const privateKey = process.env[`ADMIN_${ticker.toUpperCase()}_PRIVATE_KEY`];
    if (!publicKey || !privateKey) {
        continue;
    }
    const params = [publicKey, privateKey];
    let currentClient;
    if (ticker === "dash") {
        adminDashClient = new Dash_1.default(...params);
        currentClient = adminDashClient;
    }
    else if (ticker === "ltc") {
        adminLtcClient = new Litecoin_1.default(...params);
        currentClient = adminLtcClient;
    }
    else if (ticker === "sol") {
        adminSolClient = new Solana_1.default(...params);
        currentClient = adminSolClient;
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
(0, createPayment_1.default)(server, activePayments);
(0, activePayments_1.default)(server, activePayments);
(0, paymentStatus_1.default)(server);
async function init() {
    const { db } = await (0, mongoGenerator_1.default)();
    const _activeTransactions = await db.collection('payments').find({ status: { $nin: ["FINISHED", "EXPIRED", "FAILED"] } }).toArray();
    for (const _currActiveTransaction of _activeTransactions) {
        switch (_currActiveTransaction.currency) {
            case "sol":
                activePayments[_currActiveTransaction._id.toString()] = new Solana_2.default(id => delete activePayments[id]).fromManual({
                    ..._currActiveTransaction,
                    id: _currActiveTransaction._id.toString()
                });
                break;
            default:
                break;
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