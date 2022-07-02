import { FastifyInstance } from 'fastify';
import fastifySwagger from '@fastify/swagger';
import fastifyPlugin from 'fastify-plugin';

export default fastifyPlugin(async function createInvoiceClientRoute(server: FastifyInstance) {
    server.register(fastifySwagger, {
        routePrefix: '/docs',
        openapi: {
            info: {
                title: "Keagate – A High-performance crypto payment gateway",
                version: '0.1.0',
                description: ""
            },
            externalDocs: {
                url: "keagate.io",
                description: "Find more info here"
            },
            tags: [
                { name: 'payment', 'description': 'Payment lifecycle related administrative routes' },
                { name: 'Invoice', 'description': 'Publicly available routes that are used in the invoice UI, can also be safely called from client device since these do not return sensitive information' }
            ],
            servers: [{
                url: 'https://YOUR_SERVER'
            }],
            security: [
                
            ],
            components: {
                securitySchemes: {
                    ApiKey: {
                        type: "apiKey",
                        name: "keagate-api-key",
                        in: "header"
                    }
                }
            }
        },
        uiConfig: {
            docExpansion: 'full',
            deepLinking: false
        },
        exposeRoute: true,
    });
})
