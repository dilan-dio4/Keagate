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
            await spawnAsync('pnpm', ['run', 'start'], {
                cwd: path.join(__dirname, '..', '..', '..'),
            });
        } catch (error) {
            // prettier-ignore
            logger.error(
                `\n\n ` +
                `Error launching '${kleur.italic(`pm2`)}'. Make sure it's installed via` +
                `'${kleur.italic(`pnpm i -g pm2`)}', then start the Keagate server with` +
                `'${kleur.italic(`pnpm run start`)}'.`
            )
        }
    }

    // prettier-ignore
    logger.log(
        `\n\n ` +
        `Keagate has successfully deployed on this machine. If you're using a cloud provider like ` +
        `AWS or Azure, please be sure to ${kleur.bold(`enable public access via HTTP(S)`)}. ` +
        `You can then locate your API documentation at ${kleur.underline(config.HOST + '/docs')} ` +
        `and OpenAPI schema with '${kleur.italic(`curl localhost:8081/docs/yaml`)}'. ` +
        `Most API routes require a ${kleur.bold(`KEAGATE_API_KEY`)} header. Yours has ` +
        `been randomly generated as: "${config.KEAGATE_API_KEY}". More information on the payment ` +
        `lifecycle is available at ${kleur.underline(`https://bit.ly/3ALFxYO`)}. ` +
        `\n\n ` +
        `Instant Payment Notifications should be verified via HMAC. Your ` +
        `${kleur.bold(`IPN_HMAC_SECRET`)} has been randomly generated ` +
        `as: "${config.IPN_HMAC_SECRET}". More information on IPNs is available ` +
        `at ${kleur.underline(`https://bit.ly/3IuGZ3H`)}. ` +
        `\n\n ` +
        `You can always find and edit these configuration values ` +
        `[and many others] in ${kleur.italic(`config/local.json`)}. ` +
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
