import { mnemonicToEntropy } from 'bip39';
import * as CardanoWasm from "@emurgo/cardano-serialization-lib-nodejs"

const entropy = mnemonicToEntropy(process.env['ADA_MNEMONIC']);

export const getPrivateKey = () => {
    const keyDetails = getKeyDetails();
    return keyDetails.privateKey;
}

export const getUtxoPrivateKey = () => {
    const keyDetails = getKeyDetails();
    return keyDetails.utxoPrivateKey;
}

export const getUtxoPublicKey = () => {
    const keyDetails = getKeyDetails();
    return keyDetails.utxoPubKey;
}

export const getPublicKey = () => {
    const keyDetails = getKeyDetails();
    return keyDetails.publicKey;
}

export const getBaseAddress = () => {
    const keyDetails = getKeyDetails()
    const baseAddr = CardanoWasm.BaseAddress.new(
        CardanoWasm.NetworkInfo.testnet().network_id(),
        CardanoWasm.StakeCredential.from_keyhash(keyDetails.utxoPubKey.to_raw_key().hash()),
        CardanoWasm.StakeCredential.from_keyhash(keyDetails.stakeKey.to_raw_key().hash()),
    );
    return baseAddr;
}

const getKeyDetails = () => {
    const rootKey = CardanoWasm.Bip32PrivateKey.from_bip39_entropy(
        Buffer.from(entropy, 'hex'),
        Buffer.from(''),
    );
    const privateKey = rootKey.to_raw_key();
    const publicKey = rootKey.to_public().to_raw_key();
    const accountKey = rootKey
        .derive(harden(1852)) // purpose
        .derive(harden(1815)) // coin type
        .derive(harden(0)); // account #0

    const utxoPubKey = accountKey
        .derive(0) // external
        .derive(0)
        .to_public();

    const utxoPrivateKey = accountKey
        .derive(0) // external
        .derive(0)
        .to_raw_key();

    const stakeKey = accountKey
        .derive(2) // chimeric
        .derive(0)
        .to_public();

    return { privateKey, publicKey, utxoPrivateKey, utxoPubKey, stakeKey }

}

function harden(num: number): number {
    return 0x80000000 + num;
}