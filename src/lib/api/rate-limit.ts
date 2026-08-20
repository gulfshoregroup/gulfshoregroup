/**
 * In-memory rate limit scaffold. Swap the store for Redis in production
 * (e.g. ioredis already in dependencies) without changing route handlers.
 */
type RateLimitEntry = { count: number; resetAt: number };

const store = new Map<string, RateLimitEntry>();

export type RateLimitConfig = {
	key: string;
	limit: number;
	windowMs: number;
};

export type RateLimitResult = {
	allowed: boolean;
	remaining: number;
	resetAt: number;
};

export function checkRateLimit(config: RateLimitConfig): RateLimitResult {
	const now = Date.now();
	const existing = store.get(config.key);

	if (!existing || existing.resetAt <= now) {
		store.set(config.key, {
			count: 1,
			resetAt: now + config.windowMs,
		});
		return {
			allowed: true,
			remaining: config.limit - 1,
			resetAt: now + config.windowMs,
		};
	}

	if (existing.count >= config.limit) {
		return {
			allowed: false,
			remaining: 0,
			resetAt: existing.resetAt,
		};
	}

	existing.count += 1;
	store.set(config.key, existing);
	return {
		allowed: true,
		remaining: config.limit - existing.count,
		resetAt: existing.resetAt,
	};
}

export function rateLimitKey(prefix: string, identifier: string): string {
	return `${prefix}:${identifier}`;
}
