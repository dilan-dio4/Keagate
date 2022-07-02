import { FastifyInstance } from 'fastify';
import fastifyStatic from '@fastify/static';
import path from 'path';
import fastifyPlugin from 'fastify-plugin';

export default fastifyPlugin(async function createInvoiceClientRoute(server: FastifyInstance) {
    server.register(fastifyStatic, {
        root: path.join(__dirname, '..', '..', '..', 'invoice-client', 'dist'),
        prefix: '/static-invoice',
    });

    server.get('/invoice/:currency/:invoiceId', (request, reply) => {
        reply.sendFile('index.html');
    });
})
