import { AvailableCurrencies } from './currencies';

type MyCurrencyConfig = Partial<
    Record<
        AvailableCurrencies,
        {
            ADMIN_PUBLIC_KEY: string;
            ADMIN_PRIVATE_KEY?: string;
        }
    >
>;

export interface MyConfig extends MyCurrencyConfig {
    KEAGATE_API_KEY: string;
    IP_WHITELIST: string[];

    SEED: string;

    TRANSACTION_TIMEOUT: number;
    TRANSACTION_MIN_REFRESH_TIME: number;
    TRANSACTION_SLIPPAGE_TOLERANCE: number;

    BLOCKBOOK_RETRY_DELAY: number;

    MONGO_CONNECTION_STRING: string;
    MONGO_KEAGATE_DB: string;

    INVOICE_ENC_KEY: string;
    IPN_HMAC_SECRET?: string;

    IS_DEV: boolean;
    USE_SO_CHAIN: boolean;

    HOST?: string;
    PORT: number;
}
