"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const typebox_1 = require("@sinclair/typebox");
const auth_1 = __importDefault(require("../middlewares/auth"));
const mongoGenerator_1 = __importDefault(require("../mongoGenerator"));
const mongodb_1 = require("mongodb");
const utils_1 = require("../utils");
const PaymentStatusResponse = typebox_1.Type.Object({
    publicKey: typebox_1.Type.String(),
    // privateKey: Type.String(),
    amount: typebox_1.Type.Number(),
    expiresAt: typebox_1.Type.String(),
    createdAt: typebox_1.Type.String(),
    updatedAt: typebox_1.Type.String(),
    status: typebox_1.Type.String(),
    id: typebox_1.Type.String(),
    ipnCallbackUrl: typebox_1.Type.Optional(typebox_1.Type.String({ format: "uri" })),
    invoiceCallbackUrl: typebox_1.Type.Optional(typebox_1.Type.String({ format: "uri" })),
    payoutTransactionHash: typebox_1.Type.Optional(typebox_1.Type.String()),
    invoiceUrl: typebox_1.Type.String(),
});
const PaymentStatusQueryString = typebox_1.Type.Object({
    id: typebox_1.Type.String()
});
const opts = {
    schema: {
        response: {
            300: typebox_1.Type.String(),
            200: PaymentStatusResponse,
        },
        querystring: PaymentStatusQueryString
    },
    preHandler: auth_1.default
};
const String = typebox_1.Type.String();
function createPaymentStatusRoute(server) {
    server.get('/getPaymentStatus', opts, async (request, reply) => {
        const id = request.query.id;
        const { db } = await (0, mongoGenerator_1.default)();
        const selectedPayment = await db.collection('payments').findOne({ _id: new mongodb_1.ObjectId(id) });
        if (!selectedPayment) {
            return reply.status(300).send("No payment found");
        }
        delete selectedPayment['privateKey'];
        selectedPayment.id = selectedPayment._id.toString();
        selectedPayment.createdAt = selectedPayment.createdAt.toISOString();
        selectedPayment.updatedAt = selectedPayment.updatedAt.toISOString();
        selectedPayment.expiresAt = selectedPayment.expiresAt.toISOString();
        selectedPayment.invoiceUrl = `/invoice/${selectedPayment.currency}/${(0, utils_1.encrypt)(selectedPayment.id)}`;
        delete selectedPayment._id;
        reply.status(200).send(selectedPayment);
    });
}
exports.default = createPaymentStatusRoute;
//# sourceMappingURL=paymentStatus.js.map