import GenericNativeAdminWallet from '../GenericNativeAdminWallet';
import { ethers } from 'ethers';
import { NativeAdminConstructor } from '../../GenericAdminWallet';
import { availableNativeCurrencies } from '@keagate/common';
import config from '../../../config';
import Big from 'big.js';
import limiters from '../../../limiters';

export default class AdminPolygon extends GenericNativeAdminWallet {
    private provider: ethers.providers.JsonRpcProvider;
    private wallet: ethers.Wallet;
    public currency: typeof availableNativeCurrencies[number] = 'MATIC';

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
        const balance = await limiters[this.currency].schedule(() => this.wallet.getBalance());
        // https://github.com/ethjs/ethjs-unit/blob/35d870eae1c32c652da88837a71e252a63a83ebb/src/index.js#L38
        const confirmedBalance = Big(balance.toString()).div('1000000000000000000').toNumber();
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
        const gasPrice = await limiters[this.currency].schedule(() => this.provider.getGasPrice());

        // https://docs.ethers.io/v4/cookbook-accounts.html
        const gasLimit = 21000;
        const value = ethers.utils.parseEther('' + amount).sub(gasPrice.mul(gasLimit));
        // https://docs.ethers.io/v5/api/providers/provider/#Provider-sendTransaction
        const tx = {
            to: destination,
            value,
            gasPrice,
            gasLimit,
        };
        const txObj = await limiters[this.currency].schedule(() => this.wallet.sendTransaction(tx));
        return { result: txObj.hash };
    }
}
