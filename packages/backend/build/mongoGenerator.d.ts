import { MongoClient } from "mongodb";
export default function mongoGenerator(): Promise<{
    db: import("mongodb").Db;
    client: MongoClient;
}>;
