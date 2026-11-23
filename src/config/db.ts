import { MongoClient, Db } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not defined in environment variables");
}

const client = new MongoClient(MONGODB_URI);

let db: Db | undefined;
let connectionPromise: Promise<Db> | undefined;

export function connectDB(): Promise<Db> {
    if (db) {
        return Promise.resolve(db);
    }

    if (!connectionPromise) {
        connectionPromise = client.connect()
            .then(() => {
                db = client.db("wedplan-db1");
                console.log("Successfully connected to MongoDB!");
                return db;
            })
            .catch((error: unknown) => {
                connectionPromise = undefined;
                console.error("MongoDB connection failed:", error);
                throw error;
            });
    }

    return connectionPromise;
}

export function getDB(): Db {
    if (!db) {
        throw new Error("Database is not connected yet");
    }

    return db;
}
