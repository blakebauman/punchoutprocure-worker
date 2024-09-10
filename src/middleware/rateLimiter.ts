import { drizzle } from 'drizzle-orm/d1';
import { RateLimitSchema } from '../models/rateLimit';

const RATE_LIMIT_MAX_REQUESTS = 100; // Example: 100 requests per minute
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

// Rate limiter function
export const rateLimit = async (buyerId: string) => {
	const currentTime = Date.now();

	// Check the rate limit in the database
	const rateLimitEntry = await drizzle.select(RateLimitSchema).where({
		buyerId,
	});

	if (!rateLimitEntry) {
		// No previous entry, create a new one
		await drizzle.insert(RateLimitSchema).values({
			buyerId,
			requestCount: 1,
			lastRequestTime: currentTime,
		});
		return true;
	}

	const timeDiff = currentTime - rateLimitEntry.lastRequestTime;
	if (timeDiff > RATE_LIMIT_WINDOW) {
		// Reset the rate limit window
		await drizzle.update(RateLimitSchema).where({ buyerId }).set({
			requestCount: 1,
			lastRequestTime: currentTime,
		});
		return true;
	} else if (rateLimitEntry.requestCount < RATE_LIMIT_MAX_REQUESTS) {
		// Increment request count
		await drizzle
			.update(RateLimitSchema)
			.where({ buyerId })
			.set({
				requestCount: rateLimitEntry.requestCount + 1,
			});
		return true;
	}

	// Rate limit exceeded
	return false;
};
