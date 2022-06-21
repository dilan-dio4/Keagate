import { FastifyInstance } from "fastify";
import TransactionalSolana from '../transactionalWallets/Solana';
export default function createPaymentRoute(server: FastifyInstance, activePayments: Record<string, TransactionalSolana>): void;
