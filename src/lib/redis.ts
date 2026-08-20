import Redis from "ioredis";

let redis: Redis | null = null;
let isConnected = false;

const isDev = process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_ENV === "DEV";

try {
	if (!isDev) {
		redis = new Redis({
			host: "127.0.0.1",
			port: 6379,
			password: "t730XEKRdfAY",
			retryStrategy(times) {
				// Don't spam retries
				if (times > 3) return null;
				return 1000;
			},
			maxRetriesPerRequest: 2,
			connectTimeout: 200,
		});
	} else {
		redis = new Redis({
			host: "127.0.0.1",
			port: 6379,
			retryStrategy(times) {
				// Fail fast in local dev if Redis isn't running
				if (times > 1) return null;
				return 1000;
			},
			maxRetriesPerRequest: 2,
			connectTimeout: 200,
		});
	}
} catch (err) {
	redis = null;
}

if (redis) {
	redis.on("connect", () => {
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
	return redis !== null && isConnected;
}

export default redis;
