// https://github.com/p2p-org/p2p-wallet-web/blob/2d894ae5893b8566760c8a52050fde7e918d3139/packages/core/src/contexts/seed/utils/hd_wallet.ts
import * as ed25519 from 'ed25519-hd-key';
import nacl from 'tweetnacl';
import { bip32 } from '../../../utils';
import * as bip39 from 'bip39';
import { PublicKey } from '@solana/web3.js';
import config from '../../../config';

const DERIVATION_PATH = {
    Deprecated: 'deprecated',
    Bip44: 'bip44',
    Bip44Change: 'bip44Change',
};

type ValueOf<T> = T[keyof T];

const deriveSeed = (seed: string, walletIndex: number, derivationPath: ValueOf<typeof DERIVATION_PATH>): Buffer | undefined => {
    switch (derivationPath) {
        case DERIVATION_PATH.Deprecated: {
            const path = `m/501'/${walletIndex}'/0/0`;
            return bip32.fromSeed(Buffer.from(seed, 'hex')).derivePath(path).privateKey;
        }
        case DERIVATION_PATH.Bip44: {
            const path = `m/44'/501'/${walletIndex}'`;
            return ed25519.derivePath(path, seed).key;
        }
        case DERIVATION_PATH.Bip44Change: {
            const path = `m/44'/501'/${walletIndex}'/0'`;
            return ed25519.derivePath(path, seed).key;
        }
    }
};

export function getKeyPairFromSeed(seed: string, walletIndex: number, derivationPath: ValueOf<typeof DERIVATION_PATH>) {
    const derivedPrivateKey = deriveSeed(seed, walletIndex, derivationPath);
    if (!derivedPrivateKey) throw new Error('Could not derive secretKey');
    return nacl.sign.keyPair.fromSeed(derivedPrivateKey);
}

// const derivePublicKeyFromSeed = (
//     seed: string,
//     walletIndex: number,
//     derivationPath: ValueOf<typeof DERIVATION_PATH>,
// ) => {
//     return getKeyPairFromSeed(seed, walletIndex, derivationPath).publicKey
// }

// const deriveSecretKeyFromSeed = (
//     seed: string,
//     walletIndex: number,
//     derivationPath: ValueOf<typeof DERIVATION_PATH>,
// ) => {
//     return getKeyPairFromSeed(seed, walletIndex, derivationPath).secretKey
// }

export const generateMnemonicAndSeedAsync = async () => {
    const mnemonic = bip39.generateMnemonic(256);
    const seed = await bip39.mnemonicToSeed(mnemonic);
    return {
        mnemonic,
        seed: Buffer.from(seed).toString('hex'),
    };
};

// const mnemonicToSeed = async (mnemonic: string) => {
//     if (!bip39.validateMnemonic(mnemonic)) {
//         throw new Error('Invalid seed words')
//     }
//     const seed = await bip39.mnemonicToSeed(mnemonic)
//     return Buffer.from(seed).toString('hex')
// }

export default function generateKeypair(walletIndex: number) {
    const seed = config.getTyped('SEED');
    const keypair = getKeyPairFromSeed(seed, walletIndex, 'bip44');
    return {
        publicKey: new PublicKey(keypair.publicKey).toString(),
        secretKey: keypair.secretKey,
    };
}
