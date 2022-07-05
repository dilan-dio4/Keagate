import { program } from 'commander';
import commandExists from 'command-exists';
import logger, { LoggingLevels } from './DelegateLogger';
import spawnAsync from '@expo/spawn-async';
import prompts from 'prompts';

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

    logger.setLogLevel(logLevel);


    process.exit();
}

require.main && main();
export default main;