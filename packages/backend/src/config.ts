// https://itnext.io/node-config-made-type-safe-5be0a08ad5ba
import path from 'path';
process.env['NODE_CONFIG_DIR'] = path.join(__dirname, '..', '..', '..', 'config/'); // Must be in this order
import config from 'config';
import { AvailableProviders } from '@snow/api-providers/src';
import { AvailableCurrencies } from '@snow/common/src';

type MyCurrencyConfig = Partial<
    Record<
        AvailableCurrencies,
        {
            ADMIN_PUBLIC_KEY: string;
            ADMIN_PRIVATE_KEY: string;
            PROVIDER: AvailableProviders;
            PROVIDER_PARAMS: any[];
        }
    >
>;

interface MyConfig extends MyCurrencyConfig {
    SNOW_API_KEY?: string;
    IP_WHITELIST: string[];

    SEED: string;

    TRANSACTION_TIMEOUT: number;
    TRANSACTION_REFRESH_TIME: number;
    TRANSACTION_SLIPPAGE_TOLERANCE: number;

    MONGO_CONNECTION_STRING: string;
    MONGO_SNOW_DB: string;

    TESTNETS: boolean;
    USE_SO_CHAIN: boolean;
}

const getTyped: <T extends keyof MyConfig>(key: T) => MyConfig[T] = <T extends keyof MyConfig>(key: T) => config.get(key);
const has: (setting: string) => boolean = (setting: string) => config.has(setting);

const obj = {
    getTyped,
    has,
};

export default obj;
