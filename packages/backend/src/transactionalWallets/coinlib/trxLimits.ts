import { availableCoinlibCurrencies } from '@keagate/common';
import crypto from 'crypto';

// In pure unit
export const currencyDusts: Partial<Record<typeof availableCoinlibCurrencies[number], number>> = {
    BTC: 0.00000546,
    LTC: 0.00000546,
    DOGE: 1,
    ETH: 0.00000001,
    DASH: 0.00000546,
};

// In pure unit
export const minWalletBalances: Partial<Record<typeof availableCoinlibCurrencies[number], number>> = {};

function randU32Sync() {
    return crypto.randomBytes(4).readUInt32BE(0);
}

const safeRand = () => Math.round(randU32Sync() / 1000);

export const walletIndexGenerator: Record<typeof availableCoinlibCurrencies[number], () => number> = {
    LTC: safeRand,
    BTC: safeRand,
    DOGE: safeRand,
    ETH: safeRand,
    DASH: safeRand,
};
