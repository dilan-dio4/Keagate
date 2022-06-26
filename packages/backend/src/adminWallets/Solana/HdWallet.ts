import * as bip32 from 'bip32'
import * as ed25519 from 'ed25519-hd-key'
import nacl from 'tweetnacl'

import { DERIVATION_PATH } from '../../../constants/common'
import type { ValueOf } from '../../../types/utility-types'

const deriveSeed = (
    seed: string,
    walletIndex: number,
    derivationPath: ValueOf<typeof DERIVATION_PATH>,
): Buffer | undefined => {
    switch (derivationPath) {
        case DERIVATION_PATH.Deprecated: {
            const path = `m/501'/${walletIndex}'/0/0`
            return bip32.fromSeed(Buffer.from(seed, 'hex')).derivePath(path).privateKey
        }
        case DERIVATION_PATH.Bip44: {
            const path = `m/44'/501'/${walletIndex}'`
            return ed25519.derivePath(path, seed).key
        }
        case DERIVATION_PATH.Bip44Change: {
            const path = `m/44'/501'/${walletIndex}'/0'`
            return ed25519.derivePath(path, seed).key
        }
    }
}

function getKeyPairFromSeed(seed: string, walletIndex: number, derivationPath: ValueOf<typeof DERIVATION_PATH>) {
    const derivedPrivateKey = deriveSeed(seed, walletIndex, derivationPath)
    if (!derivedPrivateKey) throw new Error('Could not derive secretKey')
    return nacl.sign.keyPair.fromSeed(derivedPrivateKey)
}

export const derivePublicKeyFromSeed = (
    seed: string,
    walletIndex: number,
    derivationPath: ValueOf<typeof DERIVATION_PATH>,
) => {
    return getKeyPairFromSeed(seed, walletIndex, derivationPath).publicKey
}

export const deriveSecretKeyFromSeed = (
    seed: string,
    walletIndex: number,
    derivationPath: ValueOf<typeof DERIVATION_PATH>,
) => {
    return getKeyPairFromSeed(seed, walletIndex, derivationPath).secretKey
}

// export const generateMnemonicAndSeedAsync = async (): Promise<SeedAndMnemonic> => {
//   const bip39 = await import('bip39');
//   const mnemonic = bip39.generateMnemonic(256);
//   const seed = await bip39.mnemonicToSeed(mnemonic);
//   return {
//     mnemonic,
//     seed: Buffer.from(seed).toString('hex'),
//   };
// };

export const mnemonicToSeed = async (mnemonic: string) => {
    const bip39 = await import('bip39')
    if (!bip39.validateMnemonic(mnemonic)) {
        throw new Error('Invalid seed words')
    }
    const seed = await bip39.mnemonicToSeed(mnemonic)
    return Buffer.from(seed).toString('hex')
}
