"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const typebox_1 = require("@sinclair/typebox");
const auth_1 = __importDefault(require("../middlewares/auth"));
const ActivePaymentsResponse = typebox_1.Type.Array(typebox_1.Type.Object({
    publicKey: typebox_1.Type.String(),
    // privateKey: Type.String(),
    amount: typebox_1.Type.Number(),
    expiresAt: typebox_1.Type.String(),
    createdAt: typebox_1.Type.String(),
    updatedAt: typebox_1.Type.String(),
    status: typebox_1.Type.String(),
    id: typebox_1.Type.String(),
    ipnCallbackUrl: typebox_1.Type.Optional(typebox_1.Type.String()),
    invoiceCallbackUrl: typebox_1.Type.Optional(typebox_1.Type.String()),
    payoutTransactionHash: typebox_1.Type.Optional(typebox_1.Type.String())
}));
const opts = {
    schema: {
        response: {
            200: ActivePaymentsResponse
        }
    },
    preHandler: auth_1.default
};
function createActivePaymentsRoute(server, activePayments) {
    server.get('/activePayments', opts, async (request, reply) => {
        const cleanedTransactions = [];
        Object.values(activePayments).forEach(ele => {
            const details = { ...ele.getDetails() };
            delete details['privateKey'];
            cleanedTransactions.push({
                ...details,
                createdAt: details.createdAt.toISOString(),
                updatedAt: details.updatedAt.toISOString(),
                expiresAt: details.expiresAt.toISOString(),
            });
        });
        reply.status(200).send(cleanedTransactions);
    });
}
exports.default = createActivePaymentsRoute;
//# sourceMappingURL=activePayments.js.map