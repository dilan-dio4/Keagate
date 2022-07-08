import { MyConfig } from '@keagate/common';
import crypto from 'crypto';

function randomSeedGenerator(length: number) {
    return crypto.randomBytes(length).toString('hex');
}

export default async function setupSeeds(): Promise<Partial<MyConfig>> {
    // TODO IP whitelist?
    return {
        INVOICE_ENC_KEY: randomSeedGenerator(16),
        SEED: randomSeedGenerator(16),
        KEAGATE_API_KEY: randomSeedGenerator(32),
    };
}

require.main === module && setupSeeds().then(res => console.log(JSON.stringify(res, null, 2)));