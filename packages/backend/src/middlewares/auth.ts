import { FastifyReply, FastifyRequest, HookHandlerDoneFunction } from "fastify";

let IP_WHISTLIST: Set<string> = undefined;

if (process.env['IP_WHITELIST']) {
    const ips = process.env['IP_WHITELIST'].split(",");
    IP_WHISTLIST = new Set(ips);
    IP_WHISTLIST.add("127.0.0.1")
}

const auth = (request: FastifyRequest, reply: FastifyReply, done: HookHandlerDoneFunction) => {
    if (request.headers['snow-api-key'] === process.env['SNOW_API_KEY']) {
        if (IP_WHISTLIST !== undefined) {
            if (IP_WHISTLIST.has(request.ip)) {
                done();
            }
        } else {
            done();
        }
    }
}

export default auth;