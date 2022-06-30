import GenericNativeAdminWallet from '../GenericNativeAdminWallet';
import { ethers } from 'ethers';
import { NativeAdminConstructor } from '../../GenericAdminWallet';
import { AvailableCurrencies } from '@keagate/common/src';
import config from '../../../config';
import { requestRetry } from '../../../utils';
import Big from 'big.js';

export default class Polygon extends GenericNativeAdminWallet {
    private provider: ethers.providers.JsonRpcProvider;
    private wallet: ethers.Wallet;
    public currency: AvailableCurrencies = 'MATIC';

    constructor(constructor: NativeAdminConstructor) {
        super(constructor);
        this.provider = new ethers.providers.JsonRpcProvider(this.getRandomRPC());
        this.wallet = new ethers.Wallet(this.privateKey, this.provider);
    }

    private getRandomRPC() {
        if (config.getTyped('TESTNETS')) {
            return 'https://rpc.ankr.com/polygon_mumbai';
        } else {
            return 'https://rpc.ankr.com/polygon';
        }
    }

    async getBalance() {
        const balance = await this.wallet.getBalance();
        // https://github.com/ethjs/ethjs-unit/blob/35d870eae1c32c652da88837a71e252a63a83ebb/src/index.js#L38
        const confirmedBalance = Big(balance.toString()).div('1000000000000000000').toNumber()
        console.log("confirmedBalance", confirmedBalance)
        return {
            result: {
                confirmedBalance,
                unconfirmedBalance: null,
            },
        };
    }

    async sendTransaction(destination: string, amount: number) {
        if (!this.isValidAddress(destination)) {
            throw new Error('Invalid destination address');
        }
        const gasPrice = await this.provider.getGasPrice();

        // https://docs.ethers.io/v4/cookbook-accounts.html
        const gasLimit = 21000;
        const value = ethers.utils.parseEther('' + amount).sub(gasPrice.mul(gasLimit));
        // https://docs.ethers.io/v5/api/providers/provider/#Provider-sendTransaction
        const tx = {
            to: destination,
            value,
            gasPrice,
            gasLimit
        };
        const txObj = await requestRetry<ethers.providers.TransactionResponse>(() => this.wallet.sendTransaction(tx));
        return { result: txObj.hash };
    }
}
