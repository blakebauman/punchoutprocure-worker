import { validateApiKey } from '../services/tenantService';
import { validateUserApiKey } from '../services/tenantUserService';
import { checkRateLimit } from '../services/rateLimiter';

export const apiKeyAuth = async (req: Request) => {
	const apiKey = req.headers.get('X-API-Key');

	if (!apiKey) {
		return new Response(JSON.stringify({ error: 'API Key is missing' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
	}

	const tenantUser = await validateUserApiKey(apiKey);
	if (tenantUser) {
		return tenantUser; // Return tenant user information, including role
	}

	const tenant = await validateApiKey(apiKey);
	if (!tenant) {
		return new Response(JSON.stringify({ error: 'Invalid API Key' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
	}

	// Check rate limit for the tenant
	const rateLimitValid = await checkRateLimit(tenant.id);
	if (!rateLimitValid) {
		return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), { status: 429, headers: { 'Content-Type': 'application/json' } });
	}

	return tenant; // Return the tenant information for later use in the request
};
