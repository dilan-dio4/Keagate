"use strict";
// import GenericWallet from "../GenericWallet";
// import { ethers } from 'ethers';
// import { AvailableCoins, AvailableTickers } from "../../currencies";
Object.defineProperty(exports, "__esModule", { value: true });
// export default class Polygon extends GenericWallet {
//     private provider: ethers.providers.JsonRpcProvider;
//     private wallet: ethers.Wallet;
//     public ticker: AvailableTickers = "asdf";
//     public coinName: AvailableCoins = "Solana";
//     constructor(...args: ConstructorParameters<typeof GenericWallet>) {
//         super(...args);
//         this.provider = new ethers.providers.JsonRpcProvider(process.env['POLYGON_RPC']);
//         this.wallet = new ethers.Wallet(process.env['POLYGON_PRIVATE_KEY'], this.provider);
//     }
//     async getBalance() {
//         const balance = await this.wallet.getBalance();
//         return {
//             result: {
//                 confirmedBalance: balance.toNumber(),
//                 unconfirmedBalance: null
//             }
//         };
//     }
//     async sendTransaction(destination: string, amount: number) {
//         if (!this.isValidAddress(destination)) {
//             throw new Error("Invalid destination address");
//         }
//         const [nonce, gasPrice] = await Promise.all([
//             this.wallet.getTransactionCount("pending"),
//             this.provider.getGasPrice()
//         ])
//         // https://docs.ethers.io/v5/api/providers/provider/#Provider-sendTransaction
//         const tx = {
//             to: destination,
//             // Convert currency unit from ether to wei
//             value: ethers.utils.parseEther("" + (amount)),
//             gasPrice: gasPrice.mul(2),
//             nonce
//         }
//         const txObj = await this.wallet.sendTransaction(tx);
//         return { result: txObj.hash };
//     }
// }
exports.default = () => true;
//# sourceMappingURL=index.js.map