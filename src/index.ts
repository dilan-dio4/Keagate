import dotenv from 'dotenv';
dotenv.config();
import fastify from 'fastify'
import currencies, { AvailableTickers, AvailableWallets } from "./currencies";
import Dash from "./wallets/Dash";
import Litecoin from "./wallets/Litecoin";
import Solana from "./wallets/Solana";
import auth from './middlewares/auth';

const server = fastify({ trustProxy: true });

let dashClient: Dash;
let ltcClient: Litecoin;
let solClient: Solana;

for (const k of Object.keys(currencies)) {
    const ticker = k as AvailableTickers;
    const coinName = currencies[ticker].name;
    const publicKey = process.env[`${ticker.toUpperCase()}_PUBLIC_KEY`];
    const privateKey = process.env[`${ticker.toUpperCase()}_PRIVATE_KEY`];

    if (!publicKey || !privateKey) {
        continue;
    }

    const params = [ticker, coinName, publicKey, privateKey] as const;
    let currentClient: AvailableWallets;
    if (ticker === "dash") {
        dashClient = new Dash(...params);
        currentClient = dashClient;
    } else if (ticker === "ltc") {
        ltcClient = new Litecoin(...params);
        currentClient = ltcClient;
    } else if (ticker === "sol") {
        solClient = new Solana(...params);
        currentClient = solClient;
    }

    server.get(`/get${coinName}Balance`, { preHandler: auth }, (request, reply) => currentClient.getBalance());

    server.post<{ Body: Record<string, any> }>(`/send${coinName}Transaction`, { preHandler: auth }, (request, reply) => currentClient.sendTransaction(request.body.destination, request.body.amount));
}

server.listen({ port: 8081 }, (err, address) => {
    if (err) {
        console.error(err)
        process.exit(1)
    }
    console.log(`Server listening at ${address}`)
})