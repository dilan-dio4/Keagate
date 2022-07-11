import fastify, { FastifyInstance } from "fastify";
import crypto from 'crypto';
import config from './config';

interface IDevServer {
    server: FastifyInstance,
    name: string,
    port: number
}

function createIPNCallbackServer(): IDevServer {
    /**
     * For receiving IPN callbacks locally. Never use in production. Ideally, use
     * something like lambda or Azure functions.
     * More information here: https://github.com/dilan-dio4/coinlib-port#instant-payment-notifications
     */
    const ipnConsumer = fastify({
        trustProxy: true,
    });
    ipnConsumer.post<{ Body: Record<string, any> }>('/ipnCallback', (request, reply) => {
        const send = (status: string) => {
            console.log(`[IPN CALLBACK DEV]: ${status}`);
            reply.send(status);
        };
        if (request.headers['x-keagate-sig']) {
            const hmac = crypto.createHmac('sha512', config.getTyped('IPN_HMAC_SECRET'));
            hmac.update(JSON.stringify(request.body, Object.keys(request.body).sort()));
            const signature = hmac.digest('hex');

            if (signature === request.headers['x-keagate-sig']) {
                send(
                    'x-keagate-sig matches calculated signature. Can authenticate origin and validate message integrity.\n\n' +
                    JSON.stringify(request.body, null, 2),
                );
            } else {
                send(
                    `x-keagate-sig header (${request.headers['x-keagate-sig']}) does not match calculated signature (${signature}). Cannot authenticate origin and validate message integrity.` +
                    JSON.stringify(request.body, null, 2),
                );
            }
        } else {
            send('No x-keagate-sig found on POST request. Cannot authenticate origin and validate message integrity.');
        }
    });

    return {
        server: ipnConsumer,
        name: "IPN CALLBACK DEV",
        port: 8082
    };
}

export default async function devServer(server: FastifyInstance) {
    const devServers: IDevServer[] = [createIPNCallbackServer()];
    for (const currServer of devServers) {
        await currServer.server.ready();
        currServer.server.listen({ port: currServer.port }, (err, address) => {
            if (err) {
                console.error(err);
                process.exit(1);
            }
            console.log(`[${currServer.name}]: dev server listening at ${address}`);
        });
    }

    /**
     * For testing redirects from the built-in invoice interface. This should basically
     * be a website that utilizes the `status` and `invoice_id` query parameters
     * that Keagate automatically appends to the passed in URL.
     */
    server.get('/dev-callback-site', (request, reply) => {
        reply.header('Content-Type', 'text/html; charset=UTF-8');
        reply.send(`
        <!DOCTYPE html>
<html>

<body>
    <h1 style="background-color: red; color: white;">Keagate test site</h1>
    <h2 style="font-weight: 400;"><b>NEVER</b> actually call administrative routes or store your <em>keagate-api-key</em> directly with a user's browser!</h2>
    <h2 style="font-weight: 400;">Instead, call an API or Lambda from your site and invokes Keagate from there. &#128515; cheers!</h2>

    <hr />

    <p><b>Data read in URL params:</b></p>
    <ol id="url-params-data"></ol>

    <p><b>Data read from Keagate based on <em>invoice_id</em>:</b></p>
    <ol id="keagate-data"></ol>

    <p id="error-message" style="color: red;"></p>
</body>
<script type="text/javascript">
    window.addEventListener('load', function () {
        const params = new URLSearchParams(document.location.search)

        let newElements = '';
        params.forEach(function (value, key) {
            newElements += '<li><b>' + key + '</b>: ' + value + '</li>'
        })
        document.getElementById('url-params-data').innerHTML = newElements;

        if (!params.get('invoice_id')) {
            document.getElementById('error-message').innerText = "No invoice_id parameter found"
        } else {
            fetch('http://localhost:8081/getPaymentStatus?id=' + params.get('invoice_id'), {
                headers: {
                    "keagate-api-key": "${config.getTyped('KEAGATE_API_KEY')}"
                }
            })
                .then(res => res.json())
                .then(res => {
                    let newKeagateElements = '';
                    for (const [key, value] of Object.entries(res)) {
                        newKeagateElements += '<li><b>' + key + '</b>: ' + value + '</li>'
                    }
                    document.getElementById('keagate-data').innerHTML = newKeagateElements;

                })
                .catch(err => document.getElementById('error-message').innerText = JSON.stringify(err))
        }
    })
</script>

</html>
        `)
    })

}