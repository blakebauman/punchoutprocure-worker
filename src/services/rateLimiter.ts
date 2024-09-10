import { drizzle } from 'drizzle-orm/d1';
import { TenantSchema } from '../models/tenant';

// Define the rate limit: e.g., 100 requests per minute
const RATE_LIMIT_MAX_REQUESTS = 100;
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in milliseconds

// Check if tenant has exceeded the rate limit
export const checkRateLimit = async (tenantId: number) => {
	const currentTime = Date.now();

	// Query the tenant's rate limit information
	const tenant = await drizzle.select(TenantSchema).where({ id: tenantId }).first();

	if (!tenant) {
		throw new Error('Tenant not found');
	}

	// Initialize rate limiting fields if they don't exist
	if (!tenant.lastRequestTime || !tenant.requestCount) {
		tenant.requestCount = 0;
		tenant.lastRequestTime = currentTime;
	}

	// Check if the window has expired
	if (currentTime - tenant.lastRequestTime > RATE_LIMIT_WINDOW) {
		// Reset the request count and timestamp for a new window
		tenant.requestCount = 0;
		tenant.lastRequestTime = currentTime;
	}

	// Check if the tenant has exceeded the max number of requests
	if (tenant.requestCount >= RATE_LIMIT_MAX_REQUESTS) {
		return false; // Rate limit exceeded
	}

	// Increment the request count and update the tenant's rate limit info
	await drizzle
		.update(TenantSchema)
		.where({ id: tenantId })
		.set({
			requestCount: tenant.requestCount + 1,
			lastRequestTime: tenant.lastRequestTime,
		});

	return true; // Rate limit not exceeded
};
