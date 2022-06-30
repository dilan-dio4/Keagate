import GenericNativeAdminWallet from '../GenericNativeAdminWallet';
import { ethers } from 'ethers';
import { NativeAdminConstructor } from '../../GenericAdminWallet';
import { AvailableCurrencies } from '@keagate/common/src';
import config from '../../../config';
import { requestRetry } from '../../../utils';

export default class Polygon extends GenericNativeAdminWallet {
    private provider: ethers.providers.JsonRpcProvider;
    private wallet: ethers.Wallet;
    public currency: AvailableCurrencies = 'SOL';

    constructor(constructor: NativeAdminConstructor) {
        super(constructor);
        this.provider = new ethers.providers.JsonRpcProvider(this.getRandomRPC());
        this.wallet = new ethers.Wallet(config.getTyped('MATIC').ADMIN_PRIVATE_KEY, this.provider);
    }

    private getRandomRPC() {
        if (config.getTyped('TESTNETS')) {
            return 'https://rpc.ankr.com/polygon_mumbai';
        } else {
            return 'https://rpc.ankr.com/polygon';
        }
    }

    async getBalance() {
        const balance = await requestRetry<ethers.BigNumber>(() => this.wallet.getBalance());
        return {
            result: {
                confirmedBalance: balance.toNumber(),
                unconfirmedBalance: null,
            },
        };
    }

    async sendTransaction(destination: string, amount: number) {
        if (!this.isValidAddress(destination)) {
            throw new Error('Invalid destination address');
        }

        const [nonce, gasPrice] = await Promise.all([this.wallet.getTransactionCount('pending'), this.provider.getGasPrice()]);
        // https://docs.ethers.io/v5/api/providers/provider/#Provider-sendTransaction
        const tx = {
            to: destination,
            // Convert currency unit from ether to wei
            value: ethers.utils.parseEther('' + amount),
            gasPrice: gasPrice.mul(2),
            nonce,
        };
        const txObj = await requestRetry<ethers.providers.TransactionResponse>(() => this.wallet.sendTransaction(tx));
        return { result: txObj.hash };
    }
}
