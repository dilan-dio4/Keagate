import { availableCoinlibCurrencies } from "@keagate/common/src";
import crypto from 'crypto';

// In pure unit
export const currencyDusts: Record<typeof availableCoinlibCurrencies[number], number> = {
    BTC: 0.00000546,
    DASH: 0, // TODO
    LTC: 0.00000546,
    XRP: 0
}

function randU32Sync() {
    return crypto.randomBytes(4).readUInt32BE(0);
}

export const walletIndexGenerator: Record<typeof availableCoinlibCurrencies[number], () => number> = {
    LTC: randU32Sync,
    BTC: randU32Sync,
    DASH: randU32Sync,
    XRP: randU32Sync,
};
