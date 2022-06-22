import crypto from 'crypto';

interface NativeUtxo {
    txId: string;
    outputIndex: number;
    address: string;
    script: string;
    satoshis: number;
}

export function convertChainsoToNativeUtxo(Utxos: Record<string, any>[], address: string, convertToSatoshis = false): NativeUtxo[] {
    const out: NativeUtxo[] = [];
    for (const currUtxo of Utxos) {
        out.push({
            address,
            outputIndex: currUtxo.output_no,
            script: currUtxo.script_hex,
            txId: currUtxo.txid,
            satoshis: Math.round(+currUtxo.value * (convertToSatoshis ? 1E8 : 1))
        })
    }
    return out;
}

export const isBase58 = (value: string): boolean => /^[A-HJ-NP-Za-km-z1-9]*$/.test(value);

// https://gist.github.com/vlucas/2bd40f62d20c1d49237a109d491974eb?permalink_comment_id=3771967#gistcomment-3771967

const ENCRYPTION_KEY: string = process.env.INVOICE_ENCRYPTION_KEY || 'D(G+KbPeShVmYq3s6v9y$B&E)H@McQfT'; // Must be 256 bits (32 characters)
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
