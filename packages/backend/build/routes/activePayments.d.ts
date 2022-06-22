import { FastifyInstance } from "fastify";
import GenericTransactionalWallet from "../transactionalWallets/GenericTransactionalWallet";
export default function createActivePaymentsRoute(server: FastifyInstance, activePayments: Record<string, GenericTransactionalWallet>): void;
