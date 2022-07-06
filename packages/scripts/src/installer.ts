import { MyConfig } from '@keagate/common/src';
import { program } from 'commander';
import logger, { LoggingLevels } from './DelegateLogger';
import setupMongo from './setupMongo';
import setupNginx from './setupNginx';
import { existsSync, writeFileSync } from 'fs';
import path from 'path';

program
    .name('Keagate installer')
    .description('CLI for installing keagate')
    .option('-q, --quiet', 'Install quietly without asking for configuration. Sensible defaults will be applied')
    .option('-v, --verbose', 'Verbose logging')

async function main() {
    program.parse();

    let logLevel: LoggingLevels = 1;
    if (program.opts().quiet) {
        logLevel = 0;
    } else if (program.opts().verbose) {
        logLevel = 2;
    }

    let config: Partial<MyConfig> = {};

    const assignConfig = (newOptions: Partial<MyConfig>) => {
        config = {
            ...config,
            ...newOptions
        }
    }
    
    logger.setLogLevel(logLevel);
    assignConfig(await setupMongo());
    assignConfig(await setupNginx());

    if (existsSync(path.join(__dirname, '..', '..', '..', 'config/', 'local.json'))) {
        logger.log(1, 'A `config/local.json` already exists. To preserve the integrity of your previous configuration. This new configuration will be written to `config/local2.json`. Manually the new configuration into `config/local.json`, as needed.');
        writeFileSync(path.join(__dirname, '..', '..', '..', 'config/', 'local2.json'), JSON.stringify(config, null, 2));
    } else {
        writeFileSync(path.join(__dirname, '..', '..', '..', 'config/', 'local.json'), JSON.stringify(config, null, 2));
    }
    
    process.exit();
}

require.main && main();
export default main;