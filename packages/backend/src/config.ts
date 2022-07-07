// https://itnext.io/node-config-made-type-safe-5be0a08ad5ba
import path from 'path';
// TODO: Suppress NODE_APP_INSTANCE warning with PM2 + node-config
process.env['NODE_CONFIG_DIR'] = path.join(__dirname, '..', '..', '..', 'config/'); // Must be in this order
import config from 'config';
import { MyConfig } from '@keagate/common';

const getTyped: <T extends keyof MyConfig>(key: T) => MyConfig[T] = <T extends keyof MyConfig>(key: T) => config.get(key);
const has: (setting: string) => boolean = (setting: string) => config.has(setting);

const obj = {
    getTyped,
    has,
};

export default obj;
