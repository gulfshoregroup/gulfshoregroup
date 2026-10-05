// lib/safeRedis.ts
import redis, { isRedisUp } from "@/lib/redis";

export async function redisGet(key: string) {
	if (!isRedisUp() || !redis) return null;
	try {
		const value = (await Promise.race([
			redis.get(key),
			new Promise((_, reject) => setTimeout(() => reject(new Error("Redis get timeout")), 300)),
		])) as string | null;
		return value ? JSON.parse(value) : null;
	} catch (err) {
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
		await Promise.race([
			redis.set(key, JSON.stringify(value), "EX", ttlSeconds),
			new Promise((_, reject) => setTimeout(() => reject(new Error("Redis set timeout")), 300)),
		]);
	} catch (err) {
		// Do nothing – fallback mode
	}
}
