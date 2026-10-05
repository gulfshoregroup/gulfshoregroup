import Redis from "ioredis";

let redis: Redis | null = null;
let isConnected = false;

const isDev = process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_ENV === "DEV";

try {
	const redisOptions = {
		host: process.env.REDIS_HOST || "127.0.0.1",
		port: Number(process.env.REDIS_PORT) || 6379,
		password: process.env.REDIS_PASSWORD || (!isDev ? "t730XEKRdfAY" : undefined),
		enableOfflineQueue: false, // Never hang on offline queue
		connectTimeout: 500,
		maxRetriesPerRequest: 1,
		retryStrategy(times: number) {
			if (times > 2) return null;
			return 1000;
		},
	};

	redis = new Redis(redisOptions);
} catch (err) {
	redis = null;
}

if (redis) {
	redis.on("connect", () => {
		isConnected = true;
	});
	redis.on("ready", () => {
		isConnected = true;
	});
	redis.on("error", () => {
		isConnected = false;
	});
	redis.on("end", () => {
		isConnected = false;
	});
}

export function isRedisUp() {
	return redis !== null && isConnected && redis.status === "ready";
}

export default redis;
