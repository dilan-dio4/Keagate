import { MongoClient } from 'mongodb';
import prompts from 'prompts';
import spawnAsync from '@expo/spawn-async';
import logger from './DelegateLogger';
import kleur from 'kleur';
import { MyConfig } from '@keagate/common';
import opts from './opts';

const DEFAULT_MONGO_CONN_STR = 'mongodb://localhost:27017';

async function installMongo(): Promise<string> {
    logger.log('Installing MongoDB via Docker...');
    try {
        await spawnAsync('docker', 'run -d -p 27017:27017 --name keagate-mongo mongo:4.4'.split(' '));
    } catch (error) {
        if (error.output && error.output[1].startsWith('docker: Error response from daemon: Conflict. The container name')) {
            const { shouldOverwriteMongo } = await prompts({
                type: 'toggle',
                name: 'shouldOverwriteMongo',
                message: `Detected an existing Keagate mongo instance. Would you like to overwrite this?`,
                initial: false,
                active: 'yes',
                inactive: 'no',
            });

            if (shouldOverwriteMongo) {
                await spawnAsync('docker', 'stop keagate-mongo'.split(' '));
                await spawnAsync('docker', 'rm keagate-mongo'.split(' '));
                return installMongo();
            } else {
                return DEFAULT_MONGO_CONN_STR;
            }
        } else {
            logger.error(error)
            throw new Error(error);
        }
    }
    logger.success()
    return DEFAULT_MONGO_CONN_STR;
}

async function mongoFromConnectionString(mongoConnectionString: string): Promise<Partial<MyConfig>> {
    // https://mongodb.github.io/node-mongodb-native/2.2/reference/faq/
    logger.log('Testing MongoDB connection...')
    let client: MongoClient;
    try {
        client = new MongoClient(mongoConnectionString, { connectTimeoutMS: 2000, serverSelectionTimeoutMS: 3000, noDelay: true });
        await client.connect();
    } catch (error) {
        if (error.message.startsWith('connect ECONNREFUSED')) {
            logger.log(kleur.bold().red(`Could not connect to mongo instance as provided with error "ECONNREFUSED".\nPlease try again`))
            return setupMongo();
        } else {
            logger.log(kleur.bold().red(`Could not connect to mongo instance as provided with error "${error.message}".\nPlease try again`))
            return setupMongo();
        }
    }

    try {
        await client.db('keagate').collection('test').find({}).limit(1).toArray();
        logger.success()
        return {
            MONGO_CONNECTION_STRING: mongoConnectionString,
        };
    } catch (error) {
        if (error.message.startsWith('user is not allowed to do action')) {
            logger.log(kleur.underline(`Authentication required to invoke MongoDB.`));
            const { mongoUsername, mongoPassword } = await prompts([
                {
                    type: 'text',
                    name: 'mongoUsername',
                    message: `Enter MongoDB username ` + kleur.italic(`(e.g. admin)`),
                    validate: val => val.length > 0 ? true : "An input is required. Please try again."
                },
                {
                    type: 'password',
                    name: 'mongoPassword',
                    message: (prev) => `Enter ${prev}'s password`
                },
            ]);

            const mongoConnectionWithoutAuth = mongoConnectionString.replace(/\/\/.*@/, '//');
            const connectionStringParts = mongoConnectionWithoutAuth.split('//');
            const newConnectionString = connectionStringParts.shift() + '//' + `${mongoUsername}:${mongoPassword}@` + connectionStringParts.join('//');
            logger.debug(`Trying new auth connection string as ${newConnectionString}`);
            return mongoFromConnectionString(newConnectionString);
        } else {
            logger.log(kleur.bold().red(`Could invoke mongo instance with error "${error.message}".\nPlease try again`));
            return setupMongo();
        }
    }
}

export default async function setupMongo(): Promise<Partial<MyConfig>> {
    const { mongoConfig } = await prompts({
        type: 'select',
        name: 'mongoConfig',
        message: 'Choose MongoDB Configuration',
        choices: [
            { title: `Install MongoDB on this machine`, value: 'INSTALL' },
            { title: `Use an existing local MongoDB connection URL ` + kleur.italic(`(e.g mongodb://localhost:27017)`), value: 'CONNECTION-STRING' },
            { title: `Use an existing remote MongoDB connection URL ` + kleur.italic(`(e.g. mongodb://clusterN.MY-LOCATION.net)`), value: 'CONNECTION-STRING' },
        ],
        initial: 0,
    });

    if (mongoConfig === 'CONNECTION-STRING') {
        const { mongoConnectionString } = await prompts({
            type: 'text',
            name: 'mongoConnectionString',
            message: `Enter a MongoDB connection string ` + kleur.italic('(e.g mongodb://admin:password@localhost:27017)'),
            validate: val => val.length > 0 ? true : "An input is required. Please try again."
        });
        return mongoFromConnectionString(mongoConnectionString);
    } else if (mongoConfig === 'INSTALL') {
        if (opts().dryrun) {
            return { MONGO_CONNECTION_STRING: DEFAULT_MONGO_CONN_STR };
        } else {
            const mongoUrl = await installMongo();
            return mongoFromConnectionString(mongoUrl);
        }
    } else {
        return setupMongo();
    }
}
