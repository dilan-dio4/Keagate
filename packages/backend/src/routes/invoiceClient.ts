import { FastifyInstance, RouteShorthandOptions } from 'fastify';
import fastifyStatic from '@fastify/static';
import path from 'path';
import fastifyPlugin from 'fastify-plugin';
import { Type } from '@sinclair/typebox';

export default fastifyPlugin(async function createInvoiceClientRoute(server: FastifyInstance) {
    server.register(fastifyStatic, {
        root: path.join(__dirname, '..', '..', '..', 'invoice-client', 'dist'),
        prefix: '/static-invoice',
    });

    const opts: RouteShorthandOptions = {
        schema: {
            tags: ['Invoice'],
            description: `Route for Keagate's built-in invoice interface.`,
            summary: `Route for Keagate's built-in invoice interface`,
            params: Type.Object({
                currency: Type.String({
                    description: `Shorthand name of a payment's corresponding currency.`,
                }),
                invoiceId: Type.String({
                    description: `Invoice identifier. This is generated automatically as the internal id of the payment encrypted with aes-256-cbc plus your config's INVOICE_ENC_KEY.`,
                }),
            }),
        },
    };

    server.get('/invoice/:currency/:invoiceId', opts, (request, reply) => {
        reply.sendFile('index.html');
    });
});
