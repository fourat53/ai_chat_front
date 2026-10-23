import { type Db, MongoClient } from "mongodb";
import mongoose from "mongoose";

const MONGODB_URL = process.env.MONGODB_URL;

if (!MONGODB_URL) {
	throw new Error("Missing env var: MONGODB_URL");
}

declare global {
	var __mongoClientPromise: Promise<MongoClient> | undefined;
	var __mongoosePromise: Promise<typeof mongoose> | undefined;
}

let clientPromise: Promise<MongoClient>;
if (process.env.NODE_ENV === "development") {
	if (!global.__mongoClientPromise) {
		const client = new MongoClient(MONGODB_URL);
		global.__mongoClientPromise = client.connect();
	}
	clientPromise = global.__mongoClientPromise;
} else {
	const client = new MongoClient(MONGODB_URL);
	clientPromise = client.connect();
}

const syncClient = new MongoClient(MONGODB_URL);
export const db: Db = syncClient.db();

async function getDb(): Promise<Db> {
	const client = await clientPromise;
	return client.db();
}

async function connectDB() {
	if (global.__mongoosePromise) {
		return global.__mongoosePromise;
	}
	global.__mongoosePromise = mongoose.connect(MONGODB_URL as string, {
		bufferCommands: false,
	});
	await global.__mongoosePromise;
	return mongoose.connection;
}

export { clientPromise, connectDB, getDb };
