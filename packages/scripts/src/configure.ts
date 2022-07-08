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
import kleur from 'kleur';

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
        logger.log(prettyConfig);
    } else {
        if (existsSync(path.join(__dirname, '..', '..', '..', 'config/', 'local.json'))) {
            // prettier-ignore
            logger.log(
                `\n\n ` +
                `A ${kleur.italic(`config/local.json`)} already exists. To preserve the integrity ` +
                `of your previous configuration. This new configuration will be ` +
                `written to ${kleur.italic(`config/local2.json`)}. ${kleur.bold(`Manually merge`)} ` +
                `the new configuration into ${kleur.italic(`config/local.json`)} as needed. `
            );
            writeFileSync(path.join(__dirname, '..', '..', '..', 'config/', 'local2.json'), prettyConfig);
        } else {
            writeFileSync(path.join(__dirname, '..', '..', '..', 'config/', 'local.json'), prettyConfig);
        }
        try {
            await spawnAsync('pm2', ['stop', 'Keagate']);
            await spawnAsync('pm2', ['del', 'Keagate']);
        } catch (error) {
            logger.debug("Removing old process errored because it doesn't exist yet");
        }

        const startSpawn = spawnAsync('pm2', ['start', 'packages/backend/build/index.js', '--name', 'Keagate', '--time'], {
            cwd: path.join(__dirname, '..', '..', '..'),
        });
        startSpawn.child.stderr.on('data', (data) => logger.error(data));
        startSpawn.child.stdout.on('data', (data) => logger.debug(data));
        await startSpawn;
        await spawnAsync('pm2', ['save'], { cwd: path.join(__dirname, '..', '..', '..') });
    }

    // prettier-ignore
    logger.log(
        `\n\n ` +
        `Keagate has successfully launched on this machine. If you're using a cloud provider like ` +
        `AWS or Azure, please be sure to ${kleur.bold(`enable public access via HTTP(S)`)}. ` +
        `Then, you can locate your API documentation at ${kleur.underline(config.HOST + '/docs')} ` +
        `and OpenAPI schema with '${kleur.italic(`curl localhost:8081/docs/yaml`)}'. ` +
        `Most of the API routes require a ${kleur.bold(`KEAGATE_API_KEY`)} header. Your has ` +
        `been randomly generated as: "${config.KEAGATE_API_KEY}". You can always find and edit ` +
        `this value [and many others] in ${kleur.italic(`config/local.json`)}. ` +
        `\n\n ` +
        `The Keagate server is running via ${kleur.italic(`pm2`)}. To restart the server ` +
        `execute '${kleur.italic(`pm2 restart Keagate`)}'. To monitor the server ` +
        `execute '${kleur.italic(`pm2 monit Keagate`)}'. Read more about ${kleur.italic(`pm2`)} ` +
        `at ${kleur.underline(`https://pm2.keymetrics.io/`)}. You may have to close and ` +
        `re-open your terminal to start using the ${kleur.italic(`pm2`)} command.` +
        `\n\n `
    )

    process.exit();
}

require.main && main();
