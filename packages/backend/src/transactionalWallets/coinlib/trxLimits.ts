import { availableCoinlibCurrencies } from "@keagate/common/src";

// In pure unit
export const currencyDusts: Record<typeof availableCoinlibCurrencies[number], number> = {
    BTC: 0.00000546,
    DASH: 0, // TODO
    LTC: 0.00000546,
}