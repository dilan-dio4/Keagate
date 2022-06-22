import { FastifyInstance } from "fastify";
import GenericTransactionalWallet from "../transactionalWallets/GenericTransactionalWallet";
export default function createPaymentRoute(server: FastifyInstance, activePayments: Record<string, GenericTransactionalWallet>): void;
