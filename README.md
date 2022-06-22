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
* [Documentation]()
* [Troubleshoot](#troubleshoot)
* [Development](#development)
* [Contact](#contact)

## About The Project

Snow is a self-hosted, high-performance cryptocurrency payment gateway. Payments can administer via the API or with the built-in invoicing client (image below).

**Currently support currencies: Solana, Cardano, Litecoin, and Dash.**

<p align="left">
  <img src="assets/invoice-frame.png" height="600" alt="Invoice Preview">
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

Snow requires some configuration, all done through the `.env` file in the root of the directory.

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