import { availableCoinlibCurrencies } from "@keagate/common/src";

// In pure unit
export const minimumWalletBalances: Record<typeof availableCoinlibCurrencies[number], number> = {
    TRX: 0.1,
    BTC: 0,
    DASH: 0, // TODO
    LTC: 0,
}

// In pure unit
export const currencyDusts: Record<typeof availableCoinlibCurrencies[number], number> = {
    TRX: 0,
    BTC: 0.00000546,
    DASH: 0, // TODO
    LTC: 0.00000546,
}