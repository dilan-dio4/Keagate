<br />

<h2 align="center">
🌨️ Firagate – A High-Performance Cryptocurrency Payment Gateway
</h2>

<h4 align="center">
  <b>🚧 This project is actively in development 🚧</b>
</h4>

<br />
<!-- TODO: Firagate Vector --->

<!-- TABLE OF CONTENTS -->
## Table of Contents

* [About the Project](#about-the-project)
  * [Purpose](#purpose)
* [Getting Started](#getting-started)
  * [Prerequisites](#prerequisites)
  * [Installation](#installation)
* [Usage](#usage)
* [Development](#development)
  * [Adding a currency](#adding-a-currency)
  * [Adding an API route](#adding-a-currency)
  * [Customizing the invoice interface](#customizing-the-invoice-interface)
* [Troubleshoot](#troubleshoot)

## About The Project

Firagate is a self-hosted, high-performance cryptocurrency payment gateway. Payments can administer via the API or with the built-in invoicing client (image below).

**Currently support currencies: Solana, Cardano, Litecoin, and Dash.** (Bitcoin, Ripple coming next)

Todo: all trezor compatible chains falls to coinlib, others are built custom here.

<p align="left">
  <img src="assets/invoice-frame.png" width="650" alt="Invoice Preview">
</p>

### Purpose

* No KYC
* No fees (besides network) or middleman
* Private
* Self-hosted
* Easily extensible for new currencies
* Highly performant
* No IP Blocking

Funds go directly to your wallet via the one-time addresses that are created for each payment.

## Getting Started

### Prerequisites

* Install [Docker Compose](https://docs.docker.com/compose/install/).
* `git clone ...`

### Installation

TODO Create Dockerfile (Nginx, Mongo no external, Node, Npm)

### API Providers

In order to check wallet balances and broadcast transactions, Firagate needs to interact with particular blockchain APIs. There's a variety of providers out there that support different sets of blockchains. This packages bundles up connectors to popular providers with a simple, unified API.

Existing connectors can be seen in the [packages/api-providers](packages/api-providers/src/) folder. All of the one available in this package provide generous free tiers. Simply pass your API keys with the configuration below.

Currently available API providers:

| Name  | Available chains |
|-----------------|--------------|
| NowNodes | dash, ltc, btc |
| Tatum | ltc, btc, ada, and xrp |

It's very easy to add a provider, see [TatumProvider.ts](packages/api-providers/src/TatumProvider.ts) as an example.

Make sure that one of the available API providers cover each currency you plan on using.

## Usage

Firagate requires some configuration. Create a file called `local.json` in `/config`, next to `default.json`, to edit of the parameters below. Use the provided `default.json` file as a reference (your `local.json` will override these).

To configure a single currency, add an object with the key of the currencies ticker with the following attributes:

| Key                              | Description                    | Required | Default |
|----------------------------------|----------------------------|----------------------------------|--|
| `ADMIN_PUBLIC_KEY`             | Public key (address) of Litecoin admin wallet    | **Yes** | *null* (string) |
| `ADMIN_PRIVATE_KEY`         | Private key of Litecoin admin wallet. Used for programmatically sending transactions from admin   | No | *null* (string) |
| `PROVIDER`           | The `id` of a provider in packages/api-providers. | **Yes except SOL** | *null* ([AvailableProvider](packages/api-providers/src/index.ts)) |
| `PROVIDER_PARAMS`         | Parameters for a particular provider's constructor. Could be [API_KEY, REGION] like [Tatum](packages/api-providers/src/TatumProvider.ts) | No | *null* (string[]) |

Other root configuration options:

| Key                              | Description                    | Required | Default |
|----------------------------------|----------------------------|----------------------------------|--|
| `FIRAGATE_API_KEY`         | Custom key that will be required in the administrative requests `firagate-api-key` requests to Firagate | No | *null* (string) |
| `IP_WHITELIST`         | List of IP address ["1.1.1.1" , "2.2.2.2",...] to be whitelisted for administrative requests | No | [] (string[]) |
| `TRANSACTION_TIMEOUT` | Milliseconds for which a transaction will be valid for  | No | 1200000 [20 Minutes] (number) |
| `TRANSACTION_REFRESH_TIME` | Milliseconds for which each active transaction will be re-scanned | No | 10000 [10 Seconds] (number) |
| `TRANSACTION_SLIPPAGE_TOLERANCE` | Percentage of a payment that discounted as from a total payment.<br /><br />Example: a TRANSACTION_SLIPPAGE_TOLERANCE of 0.02 for a 100 SOL payment will be fulfilled at 98 SOL. | No | 0.02 (number) |
| `MONGO_CONNECTION_STRING` | Connection string for mongodb instance, which is installed automatically with docker | No | mongodb://localhost:27017 (string) |
| `MONGO_FIRAGATE_DB` | Mongo database to use for storing/managing payments | No | firagate (string) |
| `USE_SO_CHAIN` | [SoChain](https://sochain.com/api/#introduction) is a free blockchain infrastructure API for that allows for 300 requests/minute free-of-charge.<br /><br />Setting this to `true` will utilize SoChain for part of the btc, dash, and ltc payment process. **Recommended** | No | true (boolean) |
| `TESTNETS` | **For development only**. Turn on testnets for given currencies | No | false (boolean) |

Your `config/local.json` could look something like:

```js
{
  "dash": {
    "ADMIN_PUBLIC_KEY": "MY_WALLET_ADDRESS",
    "ADMIN_PRIVATE_KEY": "MY_PRIVATE_KEY",
    "PROVIDER": "NowNodes",
    "PROVIDER_PARAMS": ["MY_API_KEY"]
  },

  "FIRAGATE_API_KEY": "abcd123",
  "IP_WHITELIST": ["1.1.1.1","2.2.2.2"]
  // ...
}
```

# Development

Development experience and extensibility are a high priority for this package.

1. Git clone this package.
2. `cd Firagate && npm i`
3. Add a mongoDB connection to the `MONGO_CONNECTION_STRING` attribute in `config/local.json` along with some admin wallet credentials. For development, the [Mongo Atlas free tier](https://www.mongodb.com/cloud/atlas/signup) works great.
4. `npm run dev` to start the invoice client and backend.
    * Any changes in `packages/invoice-client/src` will be automatically reflected on refresh.
    * Any changes to the source of `packages/backend/src` will be reflected automatically via `ts-node-dev`.

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

**And that's it!** Start the dev environment and create a new payment of any amount with your new ticker.

</details>
<details>

<summary>

### Adding an API route

</summary>


</details>
<details>

<summary>

### Customizing the invoice interface

</summary>

The invoice client is a statically built React package (via Vite). This static build is served in `backend`. This functionality can be seen [here](packages/backend/src/routes/invoiceClient.ts).

Editing the react package will automatically build to `dist`, so just refresh the page to see the changes.

The source code in invoice client is pretty straight-forward, so anyone familiar with React (& TailwindCSS) should have an easy time making their desired alterations.

</details>
<details>

<summary>

### Adding a blockchain API provider

</summary>

The invoice client is a statically built React package (via Vite). This static build is served in `backend`. This functionality can be seen [here](packages/backend/src/routes/invoiceClient.ts).

Editing the react package will automatically build to `dist`, so just refresh the page to see the changes.

The source code in invoice client is pretty straight-forward, so anyone familiar with React (& TailwindCSS) should have an easy time making their desired alterations.

</details>