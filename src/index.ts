import { handlePunchOutSetupRequest, createPunchOutSetupResponse, handlePunchOutOrderMessage } from './services/punchoutService';
import { authenticateCXMLHeader } from './services/authenticationService';
import { modifyOrder } from './services/orderModificationService';
import { getOrderStatus, updateOrderStatus } from './services/orderStatusService';
import { confirmOrder } from './services/orderConfirmationService';
import { rotateApiKey } from './services/tenantService';
import { logTenantActivity } from './services/loggingService';
import { createTenantUser, deleteTenantUser, updateTenantUser } from './services/tenantUserService';
import { apiKeyAuth } from './middleware/apiKeyAuth';
import { roleBasedAccess } from './middleware/roleBasedAccess';
// import { debounce, throttle } from './utils/optimizationUtils'; // Assuming utility functions for debounce and throttle
import { BadRequestError, NotFoundError } from './utils/error';
import { ApiGateway } from './libs/gateway';

// In-memory cache for tenant information
const tenantCache = new Map<string, any>();

// Helper function to retrieve tenant user from cache or database
// async function getTenantUserFromCacheOrDb(env: any) {
// 	if (tenantCache.has(env.tenantId)) {
// 		return tenantCache.get(env.tenantId);
// 	}

// 	const tenantUser = await fetchTenantUserFromDb(env.tenantId); // Assume fetchTenantUserFromDb is a service call
// 	if (tenantUser) {
// 		tenantCache.set(env.tenantId, tenantUser); // Cache the tenant user for future requests
// 	}
// 	return tenantUser;
// }

// Initialize the API Gateway
const apiGateway = new ApiGateway();

// Middleware for rate limiting (example, assumes rate limiting is per tenant)
// apiGateway.use(async (req, env, ctx) => {
// 	const tenantId = env.tenantUser.id;
// 	const tenantRateLimit = throttle(checkRateLimit, 60000); // Throttling requests to limit excessive calls
// 	if (!tenantRateLimit(tenantId)) {
// 		return handleErrorResponse('Rate limit exceeded', 429);
// 	}
// });

// Middleware to check API Key Authentication
apiGateway.use(async (req, env, ctx) => {
	const authResponse = await apiKeyAuth(req, env);
	if (authResponse instanceof Response) {
		return authResponse; // Exit early if API key authentication fails
	}
});

// Middleware for lazy tenant user loading (with cache)
// apiGateway.use(async (req, env, ctx) => {
// 	if (!env.tenantUser) {
// 		const tenantUser = await getTenantUserFromCacheOrDb(env);
// 		if (!tenantUser) {
// 			throw new NotFoundError('Tenant not found');
// 		}
// 		env.tenantUser = tenantUser; // Cache the tenant user for future requests
// 	}
// });

// Middleware for PunchOut setup
apiGateway.use(async (req, env, ctx) => {
	const url = new URL(req.url);
	if (req.method === 'POST' && url.pathname === '/punchout/setup') {
		await logTenantActivity(env.tenantUser.id, 'PunchOutSetupRequest', 'Tenant initiated PunchOut setup request');
		const xmlString = await req.text();
		const response = await handlePunchOutSetupRequest(xmlString, env.tenantUser);
		if (response.success) {
			return new Response(response.responseXml, { headers: { 'Content-Type': 'application/xml' } });
		}
		throw new BadRequestError('PunchOut setup failed');
	}
});

// Middleware for PunchOut Setup Response
apiGateway.use(async (req, env, ctx) => {
	const url = new URL(req.url);
	if (req.method === 'POST' && url.pathname === '/punchout/response') {
		const response = await createPunchOutSetupResponse('cookie123', 'https://supplier.com/catalog');
		return new Response(response, { headers: { 'Content-Type': 'application/xml' } });
	}
});

// Middleware for CXML Header Authentication
apiGateway.use(async (req, env, ctx) => {
	const url = new URL(req.url);
	if (req.method === 'POST' && url.pathname === '/punchout/authenticate') {
		const xmlString = await req.text();
		const response = await authenticateCXMLHeader(xmlString, env.tenant); // Assuming `tenant` from env
		return new Response(JSON.stringify(response), { headers: { 'Content-Type': 'application/json' } });
	}
});

// Middleware for PunchOut Order Message
apiGateway.use(async (req, env, ctx) => {
	const url = new URL(req.url);
	if (req.method === 'POST' && url.pathname === '/punchout/order') {
		const tenantUser = env.tenantUser;
		await logTenantActivity(tenantUser.id, 'PunchOutOrderMessage', 'Tenant initiated PunchOut order message');

		const xmlString = await req.text();
		const response = await handlePunchOutOrderMessage(xmlString, tenantUser);
		if (response.success) {
			return new Response(response.responseXml, { headers: { 'Content-Type': 'application/xml' } });
		}
		return new Response(JSON.stringify(response), { status: 400, headers: { 'Content-Type': 'application/json' } });
	}
});

// Middleware for Order Confirmation
apiGateway.use(async (req, env, ctx) => {
	const url = new URL(req.url);
	if (req.method === 'POST' && url.pathname === '/order/confirm') {
		const { orderId, status, reason } = (await req.json()) as { orderId: number; status: string; reason: string };
		const response = await confirmOrder(orderId, status, reason, env.tenant);
		return new Response(JSON.stringify(response), { headers: { 'Content-Type': 'application/json' } });
	}
});

// Middleware for Order Modification
apiGateway.use(async (req, env, ctx) => {
	const url = new URL(req.url);
	if (req.method === 'POST' && url.pathname === '/order/modify') {
		const { orderId, modifications } = (await req.json()) as { orderId: number; modifications: any };
		const response = await modifyOrder(Number(orderId), modifications);
		return new Response(JSON.stringify(response), { headers: { 'Content-Type': 'application/json' } });
	}
});

// Middleware for Fetching and Updating Order Status
apiGateway.use(async (req, env, ctx) => {
	const url = new URL(req.url);

	// Fetch order status
	if (req.method === 'GET' && url.pathname === '/order/status') {
		const orderId = parseInt(url.searchParams.get('orderId') || '0');
		const status = await getOrderStatus(orderId);
		return new Response(JSON.stringify(status), { headers: { 'Content-Type': 'application/json' } });
	}

	// Update order status
	if (req.method === 'POST' && url.pathname === '/order/status') {
		const { orderId, status } = (await req.json()) as { orderId: number; status: string };
		const response = await updateOrderStatus(Number(orderId), status);
		return new Response(JSON.stringify(response), { headers: { 'Content-Type': 'application/json' } });
	}
});

// Middleware for rotating API key for tenant
apiGateway.use(async (req, env, ctx) => {
	const url = new URL(req.url);
	if (req.method === 'POST' && url.pathname === '/tenant/rotate-api-key') {
		const { tenantId } = (await req.json()) as { tenantId: string };
		const response = await rotateApiKey(Number(tenantId));
		return new Response(JSON.stringify(response), { headers: { 'Content-Type': 'application/json' } });
	}
});

// Middleware for tenant user management
apiGateway.use(async (req, env, ctx) => {
	const url = new URL(req.url);

	// Create tenant user
	if (req.method === 'POST' && url.pathname === '/tenant/user/create') {
		const roleAccess = await roleBasedAccess('admin')(req, env.tenantUser);
		if (roleAccess instanceof Response) return roleAccess;

		const { tenantId, name, email, role } = (await req.json()) as { tenantId: string; name: string; email: string; role: string };
		const response = await createTenantUser(tenantId, name, email, role);
		return new Response(JSON.stringify(response), { headers: { 'Content-Type': 'application/json' } });
	}

	// Update tenant user
	if (req.method === 'PUT' && url.pathname === '/tenant/user/update') {
		const roleAccess = await roleBasedAccess('admin')(req, env.tenantUser);
		if (roleAccess instanceof Response) return roleAccess;

		const { userId, name, email, role } = (await req.json()) as { userId: string; name: string; email: string; role: string };
		const response = await updateTenantUser(userId, name, email, role);
		return new Response(JSON.stringify(response), { headers: { 'Content-Type': 'application/json' } });
	}

	// Delete tenant user
	if (req.method === 'DELETE' && url.pathname === '/tenant/user/delete') {
		const roleAccess = await roleBasedAccess('admin')(req, env.tenantUser);
		if (roleAccess instanceof Response) return roleAccess;

		const { userId } = (await req.json()) as { userId: string };
		const response = await deleteTenantUser(Number(userId));
		return new Response(JSON.stringify(response), { headers: { 'Content-Type': 'application/json' } });
	}
});

// Export the main handler
export default {
	async fetch(req: Request, env: any, ctx: any): Promise<Response> {
		return apiGateway.handleRequest(req, env, ctx);
	},
} satisfies ExportedHandler<Env>;
