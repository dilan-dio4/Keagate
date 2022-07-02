import { FastifyInstance, RouteShorthandOptions } from 'fastify';
import fastifyStatic from '@fastify/static';
import path from 'path';
import fastifyPlugin from 'fastify-plugin';

export default fastifyPlugin(async function createInvoiceClientRoute(server: FastifyInstance) {
    server.register(fastifyStatic, {
        root: path.join(__dirname, '..', '..', '..', 'invoice-client', 'dist'),
        prefix: '/static-invoice',
    });

    const opts: RouteShorthandOptions = {
        schema: {
            tags: ['Invoice'],
            description: `Route for Keagate's builtin invoice interface.`,
            summary: `Route for Keagate's builtin invoice interface`,
        },
    };

    server.get('/invoice/:currency/:invoiceId', opts, (request, reply) => {
        reply.sendFile('index.html');
    });
})
