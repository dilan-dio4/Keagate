<!-- markdownlint-disable MD033 MD041 -->

<br />

<!-- http://ipa-reader.xyz/?text=ki%3Age%C9%AAt&voice=Joey --->

<h2 align="center">

Keagate *(&#107;&#105;&colon;&#103;&#101;&#618;&#116;)* – A High-Performance Cryptocurrency Payment Gateway

</h2>
<!--
<h4 align="center">
  <b>🚧 This project is actively in development 🚧</b>
</h4>
--->

<h4 align="center">
    <img alt="Snyk vulnerabilities" src="https://shields.io/snyk/vulnerabilities/github/dilan-dio4/keagate?style=flat-square" />
    <img alt="GitHub last commit" src="https://img.shields.io/github/last-commit/dilan-dio4/Keagate?style=flat-square">
    <img alt="GitHub top language" src="https://img.shields.io/github/languages/top/dilan-dio4/Keagate?style=flat-square">
    <a href="https://gitter.im/Keagate/community?utm_source=share-link&utm_medium=link&utm_campaign=share-link"><img alt="Gitter" src="https://img.shields.io/gitter/room/dilan-dio4/Keagate?style=flat-square"></a>
    <a href="https://dilan-dio4.github.io/keagate-example-swagger/"><img alt="Swagger Validator" src="https://img.shields.io/swagger/valid/3.0?specUrl=https%3A%2F%2Fraw.githubusercontent.com%2Fdilan-dio4%2Fkeagate-example-swagger%2Fmain%2Fkeagate-openapi3.json&style=flat-square"></a>
</h4>

<br />

<p align="center">
  <img src="assets/icon-tiny.png" width="150" alt="Keagate Icon">
</p>

<!-- TODO: Keagate Vector --->

<!-- TABLE OF CONTENTS -->
## Table of Contents

* [About the Project](#about-the-project)
  * [Purpose](#purpose)
* [Installation](#installation)
  * [One-liner](#one-liner)
  * [Docker Compose](#docker-compose)
  * [Manual](#manual-installation)
* [Configuration](#configuration)
  * [CLI](#cli)
  * [Custom](#custom)
* [Payment Lifecycle](#payment-lifecycle)
  * [API Method](#api-method)
  * [Invoice Client Method](#invoice-client-method)
* [Instant Payment Notifications](#instant-payment-notifications)
* [Development](#development)
  * [Adding an API Route](#adding-an-api-route)
  * [Customizing the Invoice Interface](#customizing-the-invoice-interface)

## About the Project

Keagate is a self-hosted, high-performance cryptocurrency payment gateway. Payments can be administered [via API](https://dilan-dio4.github.io/keagate-example-swagger/) for flexibility or with the built-in invoicing client (*image below*).

**Supported currencies: Bitcoin, Ethereum, Dogecoin, Solana, Litecoin, Polygon, Dash,** *Ripple (coming soon), Tron (coming soon)*.

<p align="left">
  <img src="assets/invoice-frame.png" width="600" alt="Invoice Preview">
</p>

### Purpose

* No KYC
* No fees, middleman, or escrow
* Self-hosted/Private
* Easily extensible
* Lightweight and highly performant

Funds go directly to your wallet via a one-time address that is generated for each payment.

## Installation

<p align="left">
  <a href="https://www.youtube.com/watch?v=dxMZIbeRJac">
    <img src="assets/yt-screenshot.png" width="700" alt="Keagate Youtube Preview">
  </a>
</p>

### One-liner

The purpose of this installation script is to get Keagate up-and-running quickly in a Linux environment. The CLI will guide you in configuring, managing, and securing the instance.

```bash
bash -c "$(curl -sSL https://raw.githubusercontent.com/dilan-dio4/Keagate/main/packages/scripts/keagate.sh)"
```

*Alternate*:

```bash
curl -o keagate.sh https://raw.githubusercontent.com/dilan-dio4/Keagate/main/packages/scripts/keagate.sh
chmod +x keagate.sh
./keagate.sh
```

This helper script has been tested on...

* Ubuntu 18+
* Debian 10+
* Amazon Linux 4.14+
* CentOS 7.9+

...via AWS and Azure.

<!-- No Docker quick install on Redhat RHEL -->

This script should run successfully on most flavors of Linux with some configuration. Otherwise, use the manual build, as it's fairly straightforward.

### Docker compose

Keagate can be run completely in Docker via Docker Compose.

Get setup seeds:

```bash
docker build -t keagate .
docker run --rm keagate node packages/scripts/build/setupSeeds.js
```

Adjust `config/local.json` as needed and make sure to set following options there:

```json
"MONGO_CONNECTION_STRING": "mongodb://db:27017",
"HOST": "0.0.0.0"
```

Then, run the following:

```bash
docker compose up -d
```

### Manual Installation

#### Prerequisites

* MongoDB – [Install](https://www.mongodb.com/docs/manual/installation/)
  * Running on your machine **OR** remotely via a connection string
* Web server (like Nginx or Apache2) – [Install](https://docs.nginx.com/nginx/admin-guide/web-server/reverse-proxy/)
  * Serving as a reverse proxy to `localhost:8081`
  * `8081` is the default port that Keagate runs on, can be changed via the [*PORT* configuration option](#custom).
* Node > 14 and NPM – [Install](https://github.com/nvm-sh/nvm#installing-and-updating)
  * Use of `nvm` to manage Node and NPM is recommended

```bash
# +++ Don't have Node?
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
nvm install 16
nvm use 16
# ---

npm i -g pnpm
pnpm setup
pnpm -g pm2

git clone https://github.com/dilan-dio4/Keagate
cd Keagate
pnpm i
pnpm run build

# +++ Configure Keagate with:
node packages/scripts/build/configure.js
# --- OR manually (see Configuration section)

pm2 start packages/backend/build/index.js --name Keagate --time
```

## Configuration

Keagate requires some configuration. This is done via a file called `local.json` in `/config`, next to `default.json`. This file will automatically be used when you start Keagate. *Note that parameters in `local.json` will overwrite those in `default.json`*.

There are **two** methods to configure Keagate, and they can be used in conjunction with each other.

### CLI

Keagate has a built-in CLI to build configurations in [packages/scripts](packages/scripts/src/configure.ts). After you've cloned and built the package. Head to the root *Keagate* directory and execute the following:

```bash
node packages/scripts/build/configure.js
```

*Note – this CLI is automatically launched in the one-liner installation script.*

The CLI will write the `config/local.json` file upon completion unless one already exists. In that case, it will write to `config/local2.json` and ask that you manually merge your new parameters, as needed.

### Custom

Create or open the file `local.json` in `/config`. You can use the provided `default.json` file as a reference **(your `local.json` will override these)**.

*The schema of the Keagate configuration can be seen (in TypeScript) at [packages/common/src/config.ts](packages/common/src/config.ts).*

#### Currencies

To configure a single currency, add an object with the key of the currency's ticker with the following attributes:

Ticker can be one of `'LTC', 'BTC', 'ETH', 'DOGE', 'SOL', 'DASH', or 'MATIC'`. [See example](#example).

| Key                              | Description                    | Required | Default |
|----------------------------------|----------------------------|----------------------------------|--|
| `ADMIN_PUBLIC_KEY`          | Public key (address) of your admin wallet    | **Yes** | *null* (string) |
| `ADMIN_PRIVATE_KEY`         | Private key of admin wallet. Only needed if you plan on programmatically sending transactions  | No | *null* (string) |

#### Protected options

This section details specific configuration parameters that should be handled with extra care. A malicious actor could manipulate the integrity of payments if they had access to these parameters.

**There's a built-in script to securely generate and print these values at random:**

```bash
node packages/scripts/build/setupSeeds.js
# OR
ts-node packages/scripts/src/setupSeeds.ts

# Prints
{
  "INVOICE_ENC_KEY": "5036...9cc3",
  "SEED": "eb08...3afc",
  "KEAGATE_API_KEY": "9fac8f7d...c6568f97",
  "IPN_HMAC_SECRET": "e50dd645...ea5baf54"
}
```

| Key                              | Description                    | Required | Default |
|----------------------------------|----------------------------|----------------------------------|--|
| `SEED`         | Seed for transactional wallet generator. Must be a 128-bit hex string. **Protect this value in production** | **Yes** | *null* (string) |
| `KEAGATE_API_KEY`         | Api key that will be required in administrative request's `keagate-api-key` header. **Protect this value in production** | No | 'API-KEY' (string) |
| `INVOICE_ENC_KEY`         | Key that will be used to encrypt payment IDs when distributed via invoice. **Protect this value in production** | **Yes** | *null* (string) |
| `IPN_HMAC_SECRET`         | Key of the HMAC signature that is set in the `x-keagate-sig` header of each POST request when using [Instant Payment Notifications](#instant-payment-notifications). **Protect this value in production** | No | *null* (string) |

#### Other options

| Key                              | Description                    | Required | Default |
|----------------------------------|----------------------------|----------------------------------|--|
| `IP_WHITELIST`         | List of IP address ["1.1.1.1" , "2.2.2.2",...] to be whitelisted for administrative requests | No | [] (string[]) |
| `TRANSACTION_TIMEOUT` | Milliseconds by which payments will be valid for. After that, the payment is expired | No | 1200000 [20 Minutes] (number) |
| `TRANSACTION_MIN_REFRESH_TIME` | Minimum milliseconds by which transactions will idle between refreshes | No | 30000 [30 Seconds] (number) |
| `TRANSACTION_SLIPPAGE_TOLERANCE` | Percentage of a total payment that is discounted as slippage.<br /><br />Example: a TRANSACTION_SLIPPAGE_TOLERANCE of 0.02 for a 100 SOL payment will be fulfilled at 98 SOL. | No | 0.02 (number) |
| `BLOCKBOOK_RETRY_DELAY` | Milliseconds to wait before re-trying a failed Blockbook request. | No | 5000 (number) |
| `MONGO_CONNECTION_STRING` | Connection string for MongoDB instance including any authentication. | No | 'mongodb://localhost:27017' (string) |
| `MONGO_KEAGATE_DB` | Mongo database to use for storing/managing payments | No | 'keagate' (string) |
| `IS_DEV` | **For development only**. Turn on testnets for given currencies and activate development features | No | false (boolean) |
| `HOST` | Your domain or IP that Keagate is running on. **This is used for aesthetics and has no functional effect on Keagate** | No | *null* (string) |
| `PORT` | The port that Keagate's backend API will run on | No | 8081 (number) |

<!-- | `USE_SO_CHAIN` | [SoChain](https://sochain.com/api/#introduction) is a free blockchain infrastructure API for that allows for 300 requests/minute free-of-charge.<br /><br />Setting this to `true` will utilize SoChain for part of the btc, dash, and ltc payment process. **Recommended** | No | true (boolean) | -->

#### Example

Your `config/local.json` could look something like:

```js
{
  "LTC": {
    "ADMIN_PUBLIC_KEY": "MY_WALLET_ADDRESS",
    "ADMIN_PRIVATE_KEY": "MY_PRIVATE_KEY"
  },

  "KEAGATE_API_KEY": "abcd123",
  "IP_WHITELIST": ["1.1.1.1","2.2.2.2"]
  // ...
}
```

## Payment Lifecycle

### API Method

The workflow for creating & confirming payments in the API-driven method is as follows:

1. Invoke the [`createPayment`](https://dilan-dio4.github.io/keagate-example-swagger/#/Payment/post_createPayment) route. Pass the following parameters in the JSON body:

    * *amount* – The total value of the payment
    * *currency* – Shorthand name of the desired currency (e.g. `"LTC"`)
    * [*ipnCallbackUrl* – URL to synchronously send payment status updates to](#instant-payment-notifications)
    * **Optional** *extraId* – Some external identification string (useful for manually managing the identity of payment with [`getPaymentsByExtraId`](https://dilan-dio4.github.io/keagate-example-swagger/#/Payment/get_getPaymentsByExtraId))

2. Notify your customer to send the *amount* to the *publicKey* returned from [`createPayment`](https://dilan-dio4.github.io/keagate-example-swagger/#/Payment/post_createPayment).
  
    * **Optional** Display [other metadata](https://dilan-dio4.github.io/keagate-example-swagger/#model-def-0) as well, for a streamlined user experience. Use the screenshot above as a reference.

3. Wait for your customer to send the payment.

    * **Optional** Invoke the [`getInvoiceStatus`](https://dilan-dio4.github.io/keagate-example-swagger/#/Invoice/get_getInvoiceStatus) route on a timer from the customer's device to provide real-time updates. *Note: this route doesn't return any sensitive information*.

4. Confirm and process the payment in your [IPN](#instant-payment-notifications) route after receiving a **CONFIRMED** status of a payment of the same *id* or *extraId*.

### Invoice Client Method

The workflow for creating & confirming payments with the built-in invoice client is as follows:

1. Invoke the [`createPayment`](https://dilan-dio4.github.io/keagate-example-swagger/#/Payment/post_createPayment) route. Pass the following parameters in the JSON body:

    * *amount* – The total value of the payment
    * *currency* – Shorthand name of the desired currency (e.g. `"LTC"`)
    * Either or both of:
      * [*invoiceCallbackUrl* – Route that your customers will be directed to after their payment finishes](#invoice-client-callback-url)
      * [*ipnCallbackUrl* – URL to synchronously send payment status updates to](#instant-payment-notifications)
    * **Optional** *extraId* – Some external identification string (useful for manually managing the identity of payment with [`getPaymentsByExtraId`](https://dilan-dio4.github.io/keagate-example-swagger/#/Payment/get_getPaymentsByExtraId))

2. Direct users to the URL route provided in the `invoiceUrl` attribute returned from [`createPayment`](https://dilan-dio4.github.io/keagate-example-swagger/#/Payment/post_createPayment).

    * *Note: this is not a full URL, just a path. It should be appended to the URL of your Keagate server*.

3. Confirm and process the payment with either method:

    * If you set *ipnCallbackUrl*, with your [IPN](#instant-payment-notifications) route after receiving a **CONFIRMED** status of a payment of the same *id* or *extraId*.
    * If you set *invoiceCallbackUrl*, with the [Invoice Client Callback Url](#invoice-client-callback-url) page that customers are directed to after the invoice client observes a finished payment.

### Invoice Client Callback Url

Two query parameters are appended to this URL when customers are directed to it from the invoice client:

* *invoice_id* – The encrypted id of the payment (as seen in the `invoiceUrl` attribute of [`createPayment`](https://dilan-dio4.github.io/keagate-example-swagger/#/Payment/post_createPayment)).
* *status* – The [*assumed*] status of the payment: "CONFIRMED", "FAILED", "EXPIRED", etc. **This is just to help you visually notify the customer in your site, but cannot be trusted (see below)**.

**You must still confirm the payment server-side**. This is because a malicious customer could just manually go to this route and set the status to **CONFIRMED**. On your backend, use [`getPaymentStatus`](https://dilan-dio4.github.io/keagate-example-swagger/#/Payment/get_getPaymentStatus) to actually validate the status.

*Note: you can send either a true database id or invoice_id [which are just encrypted database ids] to [`getPaymentStatus`](https://dilan-dio4.github.io/keagate-example-swagger/#/Payment/get_getPaymentStatus). Keagate can figure out which id it is based on the input length.*

Once you've validated the payment status via a server-side request from the *invoiceCallbackUrl* page, you can confirm and process the payment as normal.

## Instant Payment Notifications

To be notified of payment updates in real-time, use instant payment notifications (IPN).

### Use IPNs

1. Make sure you have configured the *IPN_HMAC_SECRET* attribute in [Configuration](#protected-options). This will allow you to guarantee the origin and trust in the integrity of incoming messages.
2. Have access to some API or serverless function that can be invoked publicly via URL.
3. Pass this URL into the `ipnCallbackUrl` attribute of your [*createPayment*](https://dilan-dio4.github.io/keagate-example-swagger/#/Payment/post_createPayment) requests.

Just like that, IPNs are all set up on Keagate. A POST request will be sent to the `ipnCallbackUrl` with a JSON object like that of [*TypeForRequest*](https://dilan-dio4.github.io/keagate-example-swagger/#model-def-0).

Before using these notifications, the last thing to do is validate all incoming messages via HMAC.

### Validate IPN Messages

The previously configured *IPN_HMAC_SECRET* is used as a key in the sha-512 HMAC signature generated for the `x-keagate-sig` header of each notification.

*Note: be sure to sort the request body alphabetically before generating your HMAC.*

Here's a NodeJS example of validating this header in Express.

```js
var crypto = require('crypto')
var express = require('express')

const app = express()
app.use(express.json())

app.post('/ipnCallback', (req, res) => {
  // +++ Generate my signature
  const hmac = crypto.createHmac('sha512', IPN_HMAC_SECRET)
  hmac.update(JSON.stringify(req.body, Object.keys(req.body).sort()))
  const signature = hmac.digest('hex')
  // ---

  if (signature === req.headers['x-keagate-sig']) {
    // Good to go!
    const id = req.body.id
    // ...
  } else {
    // This notification may be spoofed...
  }
});
```

## Development

Development experience and extensibility are the utmost priority of this package.

To get started:

1. Clone this repo.
2. Install `pnpm` globally with `npm i -g pnpm`
3. `cd Keagate && pnpm i`
4. Add a MongoDB connection to the `MONGO_CONNECTION_STRING` attribute in `config/local.json`, along with some admin wallet credentials and the other [required configuration parameters](#custom). For development, the [Mongo Atlas free tier](https://www.mongodb.com/cloud/atlas/signup) works great.
5. `pnpm run dev` to start the invoice client and backend.
    * Any changes in `packages/invoice-client/src` will be automatically reflected on refresh.
    * Any changes to the source of `packages/backend/src` will be reflected automatically via `ts-node-dev`.
    * Any changes to `config/local.json` have to be manually refreshed.

The backend will run at `127.0.0.1:8081`. You can see your Swagger API docs at `http://127.0.0.1/docs`. Also, a test IPN callback server will run at `127.0.0.1:8082/ipnCallback` and a test invoice client redirect static site will be available at `http://127.0.0.1/dev-callback-site`.

<details>

<summary>

### Adding an API Route

</summary>

Keagate follows the [Fastify plugin pattern](https://www.fastify.io/docs/latest/Reference/Plugins/). Place your route in [`packages/backend/src/routes`](packages/backend/src/routes). The `default export` of the file should be a function that takes a *Fastify* instance as a parameter. In that function, add your route to the provided *Fastify* instance. **Be sure to add a schema to your route via the `RouteShorthandOptions` type exported from Fastify. Schemas should be built with [TypeBox](https://github.com/sinclairzx81/typebox).

The schemas will appear in your Swagger docs for a unified developer experience.

Finally, in [`packages/backend/src/index.ts`](packages/backend/src/index.ts), register your new route like so:

```ts
import createPaymentStatusRoute from './routes/paymentStatus';
import createPaymentsByExtraIdRoute from './routes/paymentsByExtraId';
import create_YOUR_FUNCTIONALITY_Route from './routes/YOUR_FUNCTIONALITY'; // <--

// ...

server.register(createPaymentStatusRoute);
server.register(createPaymentsByExtraIdRoute);
server.register(create_YOUR_FUNCTIONALITY_Route); // <--
```

Use [`packages/backend/src/routes/activePayments.ts`](packages/backend/src/routes/activePayments.ts) as a reference of an authenticated route.

Use [`packages/backend/src/routes/invoiceStatus.ts`](packages/backend/src/routes/invoiceStatus.ts) as a reference of an unauthenticated route.

</details>
<details>

<summary>

### Customizing the Invoice Interface

</summary>

The invoice client is a statically built React package (via Vite). This static build is served in `backend`. This functionality can be seen [here](packages/backend/src/routes/invoiceClient.ts).

Editing the react package will automatically build to `packages/invoice-client/dist`, so just refresh the page to see any changes.

The source of `invoice-client`'s React project is pretty straightforward, so those familiar with React (& TailwindCSS) should have an easy time making their desired alterations.

</details>

<!--
<details>

<summary>

### Adding a currency

</summary>

There's four steps in adding a currency to this package.

1. Add the ticker, along with some metadata, to the currencies type in [packages/common/src/currencies.ts](packages/common/src/currencies.ts).
2. Create the admin wallet. This is where payments are finally sent to and presumably the real wallet of the client. Note that the admin wallet can also be used to programmatically send transactions as well.
    * Start by taking a look at [Solana's admin wallet](packages/backend/src/adminWallets/Solana/index.ts) and note that you only need to implement two functions: `getBalance` and `sendTransaction`. The class that admin wallets inherit from, [GenericAdminWallet](packages/backend/src/adminWallets/GenericAdminWallet.ts), handles class inheritance.
3. Create the transactional wallet. This class can be thought of a payment, since a new transactional wallet is created for every payment, along with a new Public Key and Private Key. Transactional wallets, and their associated payment data, are stored in Mongo.
    1. Start by taking a look at [Solana's transactional wallet](packages/backend/src/transactionalWallets/Solana/index.ts) and note that you only need to implement three functions: `fromNew`, `getBalance` and `_cashOut`. The class that transactional wallets inherit from, [GenericTransactionalWallet](packages/backend/src/transactionalWallets/GenericTransactionalWallet.ts), handles the rest.  
4. Add both the transactional and admin wallet classes to [packages/backend/src/currenciesToWallets.ts](packages/backend/src/currenciesToWallets.ts) so it can be referred to by ticker across the project

**And that's it!** Start the dev environment (`pnpm run dev`) and create a new payment of any amount with your new currency.

</details>

<details>

<summary>

### Adding a blockchain API provider

</summary>

The invoice client is a statically built React package (via Vite). This static build is served in `backend`. This functionality can be seen [here](packages/backend/src/routes/invoiceClient.ts).

Editing the react package will automatically build to `dist`, so just refresh the page to see the changes.

The source code in invoice client is pretty straight-forward, so anyone familiar with React (& TailwindCSS) should have an easy time making their desired alterations.

</details>

<details>

<summary>

### API Providers

</summary>

In order to check wallet balances and broadcast transactions, Keagate needs to interact with particular blockchain APIs. There's a variety of providers out there that support different sets of blockchains. This packages bundles up connectors to popular providers with a simple, unified API.

Existing connectors can be seen in the [packages/api-providers](packages/api-providers/src/) folder. All of the one available in this package provide generous free tiers. Simply pass your API keys with the configuration below.

Currently available API providers:

| Name  | Available chains |
|-----------------|--------------|
| NowNodes | dash, ltc, btc |
| Tatum | ltc, btc, ada, and xrp |

It's very easy to add a provider, see [TatumProvider.ts](packages/api-providers/src/TatumProvider.ts) as an example.

Make sure that one of the available API providers cover each currency you plan on using.

</details>

-->
