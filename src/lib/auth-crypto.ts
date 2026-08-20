import { pbkdf2Sync, randomBytes } from "crypto";

/**
 * Hashes a plain-text password using Node's built-in PBKDF2 function.
 * Returns salt and hash separated by a colon.
 */
export function hashPassword(password: string): string {
	const salt = randomBytes(16).toString("hex");
	const hash = pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
	return `${salt}:${hash}`;
}

/**
 * Verifies a plain-text password against a stored hash string.
 */
export function verifyPassword(password: string, stored: string): boolean {
	if (!stored || !stored.includes(":")) return false;
	const [salt, originalHash] = stored.split(":");
	const hash = pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
	return hash === originalHash;
}
