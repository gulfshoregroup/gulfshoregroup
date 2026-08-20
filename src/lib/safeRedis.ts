// lib/safeRedis.ts
import redis, { isRedisUp } from "@/lib/redis";

export async function redisGet(key: string) {
	if (!isRedisUp() || !redis) return null;
	try {
		const value = await redis.get(key);
		return value ? JSON.parse(value) : null;
	} catch (err) {
		console.error("Redis GET failed:", err);
		return null; // fallback
	}
}

export async function redisSet(
	key: string,
	value: any,
	ttlSeconds = 3600
) {
	if (!isRedisUp() || !redis) return;
	try {
		await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
	} catch (err) {
		console.error("Redis SET failed:", err);
		// Do nothing – fallback mode
	}
}
