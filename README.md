<br />

<h2 align="center">
🌨️ Snow – A High-Performance Cryptocurrency Payment Gateway
</h2>

<h4 align="center">
  <b>🚧 This project is actively in development 🚧</b>
</h4>

<br />
<!-- TODO: Snow Vector --->

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

Snow is a self-hosted, high-performance cryptocurrency payment gateway. Payments can administer via the API or with the built-in invoicing client (image below).

**Currently support currencies: Solana, Cardano, Litecoin, and Dash.**

<p align="left">
  <img src="assets/invoice-frame.png" width="650" alt="Invoice Preview">
</p>

### Purpose

* No KYC
* No fees (besides network)
* Private
* Self-hosted
* Easily extensible for new currencies
* Highly performant
* No IP Blocking

Funds go directly to your wallet via one-time addresses that are created for each payment.

## Getting Started

### Prerequisites

* Install [Docker Compose](https://docs.docker.com/compose/install/).
* `git clone ...`

### Installation

TODO Create Dockerfile (Nginx, Mongo no external, Node, Npm)

## Usage

Snow requires some configuration. Create a file called `.env` in the project root to edit of the parameters below. Use the provided `.env.default` file as a reference (your `.env` will override these).

| Key                              | Description                    | Required | Default |
|----------------------------------|----------------------------|----------------------------------|--|
| `ADMIN_DASH_PUBLIC_KEY`             | Public key (address) of Dash admin wallet    | **Yes** | *null* |
| `ADMIN_DASH_PRIVATE_KEY`         | Private key of Dash admin wallet. Used for programmatically sending transactions from admin   | No |  *null* |
| `DASH_RPC_URL`           | URL of Dash RPC, such as ([getblock.io](getblock.io)). | **Yes** | *null* |
| `DASH_RPC_API_KEY`         | Optional API key to the Dash RPC  | No | *null* |
| `ADMIN_LTC_PUBLIC_KEY`             | Public key (address) of Litecoin admin wallet    | **Yes** | *null* |
| `ADMIN_LTC_PRIVATE_KEY`         | Private key of Litecoin admin wallet. Used for programmatically sending transactions from admin   | No | *null* |
| `LTC_RPC_URL`           | URL of Litecoin RPC, such as ([getblock.io](getblock.io)). | **Yes** | *null* |
| `LTC_RPC_API_KEY`         | Optional API key to the Litecoin RPC  | No | *null* |
| `ADMIN_SOL_PUBLIC_KEY`             | Public key (address) of Solana admin wallet    | **Yes** | *null* |
| `ADMIN_SOL_PRIVATE_KEY`         | Private key of Solana admin wallet. Used for programmatically sending transactions from admin   | No | *null* |
| `SOL_RPC_URL`           | URL of Solana RPC. | No | https://api.mainnet-beta.solana.com |
| `SOL_RPC_API_KEY`         | Optional API key to the Solana RPC  | No | *null* |
| `SNOW_API_KEY`         | Custom key that will be required in the administrative requests `snow-api-key` requests to Snow | No | *null* |
| `IP_WHITELIST`         | List of IP address (1.1.1.1,2.2.2.2,...) to be whitelisted for administrative requests | No | *null* |
| `TRANSACTION_TIMEOUT` | Milliseconds for which a transaction will be valid for  | No | 1200000 (20 Minutes) |
| `TRANSACTION_REFRESH_TIME` | Milliseconds for which each active transaction will be re-scanned | No | 10000 (10 Seconds) |
| `TRANSACTION_SLIPPAGE_TOLERANCE` | Percentage of a payment that discounted as transactional slippage (e.g. a TRANSACTION_SLIPPAGE_TOLERANCE of 0.02 for a 100 SOL transaction will mean that at 98 SOL the transaction will be considered fulfilled). This is recommended for a smoother experience given transaction fees. | No | 0.02 |
| `MONGO_CONNECTION_STRING` | Connection string for mongodb instance, which is installed automatically with docker | No | mongodb://localhost:27017 |
| `MONGO_SNOW_DB` | Mongo database to use for storing/managing payments | No | snow |
| `TESTNETS` | **For development only**. Turn on testnets for given currencies | No | false |

# Development

Development experience and extensibility are a high priority for this package.

1. Git clone this package.
2. `cd Snow && npm i`
3. Add a mongoDB connection to the `MONGO_CONNECTION_STRING` .env parameters. For development, the [Mongo Atlas free tier](https://www.mongodb.com/cloud/atlas/signup) works great.
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
