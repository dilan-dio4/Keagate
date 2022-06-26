import { MongoClient } from 'mongodb'
import config from './config'

let clientInstance: MongoClient

export default async function mongoGenerator() {
    if (!clientInstance) {
        // Default options: https://github.com/mongodb/node-mongodb-native/blob/ee414476aa839e364bce6b26ab47859be1b99307/src/connection_string.ts#L825
        // https://stackoverflow.com/a/56438581
        const _client = new MongoClient(config.getTyped('MONGO_CONNECTION_STRING'), {
            keepAlive: true,
            socketTimeoutMS: 2000000,
        })
        await _client.connect()
        _client.on('topologyClosed', () => (clientInstance = undefined))
        clientInstance = _client
    }

    return {
        db: clientInstance.db(config.getTyped('MONGO_SNOW_DB')),
        client: clientInstance,
    }
}
