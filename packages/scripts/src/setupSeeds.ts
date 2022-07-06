import { MyConfig } from '@keagate/common';
import crypto from 'crypto';

function randomSeedGenerator(length: number) {
    return crypto.randomBytes(length).toString('hex');
}

export default async function setupSeeds(): Promise<Partial<MyConfig>> {
    return {
        INVOICE_ENC_KEY: randomSeedGenerator(16),
        SEED: randomSeedGenerator(32)
    };
}
