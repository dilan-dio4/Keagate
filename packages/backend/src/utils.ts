import crypto from 'crypto';
import { BIP32Factory, BIP32API } from 'bip32';
import * as ecc from 'tiny-secp256k1';

export const bip32: BIP32API = BIP32Factory(ecc);

export const isBase58 = (value: string): boolean => /^[A-HJ-NP-Za-km-z1-9]*$/.test(value);

// https://gist.github.com/vlucas/2bd40f62d20c1d49237a109d491974eb?permalink_comment_id=3771967#gistcomment-3771967

const ENCRYPTION_KEY = 'D(G+KbPeShVmYq3s6v9y$B&E)H@McQfT'; // Must be 256 bits (32 characters) // TODO: CONFIG THIS
const IV_LENGTH = 16; // For AES, this is always 16
const iv = 'dac6ff95b69d8a5b48f100269552d0b6'.slice(0, IV_LENGTH);

export function encrypt(text: string, encryptionKey: string = ENCRYPTION_KEY): string {
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(encryptionKey), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return encrypted.toString('hex');
}

export function decrypt(text: string, encryptionKey: string = ENCRYPTION_KEY): string {
    const encryptedText = Buffer.from(text, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(encryptionKey), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}

export function randU32Sync() {
    return crypto.randomBytes(4).readUInt32BE(0);
}

export function randomSeedGenerator() {
    return crypto.randomBytes(32).toString('hex');
}

export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
