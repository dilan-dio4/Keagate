import { MyConfig } from '@keagate/common';
import { program } from 'commander';
import logger, { LoggingLevels } from './DelegateLogger';
import setupMongo from './setupMongo';
import setupNginx from './setupNginx';
import setupSeeds from './setupSeeds';
import setupWallets from './setupWallets';
import { existsSync, writeFileSync } from 'fs';
import path from 'path';
import opts, { setOpts } from './opts';
import spawnAsync from '@expo/spawn-async';

program
    .name('Keagate configure')
    .description('CLI for configuring keagate')
    .option('-q, --quiet', 'Install quietly without asking for configuration. Sensible defaults will be applied')
    .option('-v, --verbose', 'Verbose logging')
    .option('-d --dryrun', 'Dry run. No downloading of programs or editing of your file system will occur.');

async function main() {
    program.parse();
    setOpts(program.opts());

    let logLevel: LoggingLevels = 1;
    if (opts().quiet) {
        logLevel = 0;
    } else if (opts().verbose) {
        logLevel = 2;
    }
    logger.setLogLevel(logLevel);

    let config: Partial<MyConfig> = {};

    const assignConfig = (newOptions: Partial<MyConfig>) => {
        config = {
            ...config,
            ...newOptions,
        };
    };

    assignConfig(await setupMongo());
    assignConfig(await setupNginx());
    assignConfig(await setupSeeds());
    assignConfig(await setupWallets());

    const prettyConfig = JSON.stringify(config, null, 2);

    if (opts().dryrun) {
        console.log(prettyConfig);
    } else {
        if (existsSync(path.join(__dirname, '..', '..', '..', 'config/', 'local.json'))) {
            logger.log(
                1,
                'A `config/local.json` already exists. To preserve the integrity of your previous configuration. This new configuration will be written to `config/local2.json`. Manually the new configuration into `config/local.json`, as needed.',
            );
            writeFileSync(path.join(__dirname, '..', '..', '..', 'config/', 'local2.json'), prettyConfig);
        } else {
            writeFileSync(path.join(__dirname, '..', '..', '..', 'config/', 'local.json'), prettyConfig);
        }
        spawnAsync('pnpm', ['run', '']);
    }

    process.exit();
}

require.main && main();
