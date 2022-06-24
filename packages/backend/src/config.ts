// https://itnext.io/node-config-made-type-safe-5be0a08ad5ba
import path from 'path';
process.env["NODE_CONFIG_DIR"] = path.join(__dirname, '..', '..', '..', 'config/'); // Must be in this order
import config from 'config';
import { AvailableProviders } from '@snow/api-providers/src';
import { AvailableCurrencies } from '@snow/common/src';

type MyCurrencyConfig = Partial<Record<AvailableCurrencies, {
  "ADMIN_PUBLIC_KEY": string;
  "ADMIN_PRIVATE_KEY": string;
  "PROVIDER": AvailableProviders;
  "PROVIDER_PARAMS": any[];
}>>

interface MyConfig extends MyCurrencyConfig {
    SNOW_API_KEY?: string;
    IP_WHITELIST: string[];

    TRANSACTION_TIMEOUT: number;
    TRANSACTION_REFRESH_TIME: number;
    TRANSACTION_SLIPPAGE_TOLERANCE: number;
    
    MONGO_CONNECTION_STRING: string;
    MONGO_SNOW_DB: string;

    TESTNETS: boolean;
    USE_SO_CHAIN: boolean;
}

// Augment type definition for node-config.
// It helps TypeScript to learn about uor new method we're going to add to our prototype.
declare module 'config' {
  interface IConfig {
    // This method accepts only first-level keys of our IConfigApp interface (e.g. 'cat').
    // TypeScript compiler is going to fail for anything else.
    getTyped: <T extends keyof MyConfig>(key: T) => MyConfig[T]
  }
}

const prototype: config.IConfig = Object.getPrototypeOf(config)
// Yep. It's still the same `config.get`. The real trick here was with augmenting the type definition for `config`.
prototype.getTyped = config.get


export default config;
