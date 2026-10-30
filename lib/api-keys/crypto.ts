import "server-only";

import {
	createCipheriv,
	createDecipheriv,
	randomBytes,
	scryptSync,
} from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_BYTES = 32;
const IV_BYTES = 12;
const KEY_VERSION = "v1";
const SECRET_ENV = "API_KEYS_SECRET";
const SALT = "chat-example:api-keys:v1";

let cachedKey: Buffer | null = null;

function encryptionKey(): Buffer {
	if (cachedKey) return cachedKey;

	const secret = process.env[SECRET_ENV];
	if (!secret) {
		throw new Error(`Missing env var: ${SECRET_ENV}`);
	}

	cachedKey = scryptSync(secret, SALT, KEY_BYTES);
	return cachedKey;
}

function encryptApiKey(plaintext: string): string {
	const iv = randomBytes(IV_BYTES);
	const cipher = createCipheriv(ALGORITHM, encryptionKey(), iv);
	const ciphertext = Buffer.concat([
		cipher.update(plaintext, "utf8"),
		cipher.final(),
	]);

	return [
		KEY_VERSION,
		iv.toString("base64"),
		cipher.getAuthTag().toString("base64"),
		ciphertext.toString("base64"),
	].join(":");
}

function decryptApiKey(stored: string): string {
	const [version, iv, authTag, ciphertext] = stored.split(":");
	if (version !== KEY_VERSION || !iv || !authTag || !ciphertext) {
		throw new Error("Invalid encrypted API key format");
	}

	const decipher = createDecipheriv(
		ALGORITHM,
		encryptionKey(),
		Buffer.from(iv, "base64"),
	);
	decipher.setAuthTag(Buffer.from(authTag, "base64"));
	return Buffer.concat([
		decipher.update(Buffer.from(ciphertext, "base64")),
		decipher.final(),
	]).toString("utf8");
}

export { decryptApiKey, encryptApiKey };
