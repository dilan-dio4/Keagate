import { FastifyReply, FastifyRequest, HookHandlerDoneFunction } from "fastify";
declare const auth: (request: FastifyRequest, reply: FastifyReply, done: HookHandlerDoneFunction) => void;
export default auth;
