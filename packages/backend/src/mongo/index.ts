import { Db } from 'mongodb';
import mongoGenerator from './generator';

const _load = (db: Db, collection: 'payments') =>
    db
        .collection(collection)
        .find({ status: { $nin: ['FINISHED', 'EXPIRED', 'FAILED'] } })
        .toArray();

export async function getExistingPayments() {
    const { db } = await mongoGenerator();
    return await _load(db, 'payments');
}
