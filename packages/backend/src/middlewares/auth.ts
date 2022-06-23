import { FastifyReply, FastifyRequest, HookHandlerDoneFunction } from "fastify";
import config from '../config';

let IP_WHITELIST: Set<string> = undefined;

if (config.getTyped('IP_WHITELIST').length > 0) {
    IP_WHITELIST = new Set(config.getTyped('IP_WHITELIST'));
    IP_WHITELIST.add("127.0.0.1")
}

const auth = (request: FastifyRequest, reply: FastifyReply, done: HookHandlerDoneFunction) => {
    if (request.headers['snow-api-key'] === config.getTyped('SNOW_API_KEY')) {
        if (IP_WHITELIST !== undefined) {
            if (IP_WHITELIST.has(request.ip)) {
                done();
            }
        } else {
            done();
        }
    }
}

export default auth;