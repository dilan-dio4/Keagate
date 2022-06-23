import { FastifyInstance } from "fastify";
import fastifyStatic from "@fastify/static";
import path from 'path';

export default function createInvoiceClientRoute(server: FastifyInstance) {
    server.register(fastifyStatic, {
        root: path.join(__dirname, '..', '..', '..', 'invoice-client', 'dist'),
        prefix: '/static-invoice'
    })
    
    server.get('/invoice/:currency/:invoiceId', (request, reply) => {
        reply.sendFile('index.html')
    })
}