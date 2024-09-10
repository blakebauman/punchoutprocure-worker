import { randomBytes } from 'node:crypto';
import { drizzle } from 'drizzle-orm/d1';
import { TenantSchema } from '../models/tenant';

// Generate a random API key
export const generateApiKey = (): string => {
	return randomBytes(32).toString('hex'); // 256-bit key
};

// Create a new tenant with an API key
export const createTenant = async (name: string) => {
	const apiKey = generateApiKey();
	await drizzle.insert(TenantSchema).values({
		name,
		apiKey,
		createdAt: new Date(),
	});
	return { success: true, apiKey };
};

// Validate API key for tenant
export const validateApiKey = async (apiKey: string) => {
	const tenant = await drizzle.select(TenantSchema).where({ apiKey }).first();
	return tenant ? tenant : null;
};

// Rotate the API key for a tenant
export const rotateApiKey = async (tenantId: number) => {
	const newApiKey = generateApiKey();

	await drizzle.update(TenantSchema).where({ id: tenantId }).set({ apiKey: newApiKey });

	return { success: true, apiKey: newApiKey };
};

// Revoke the API key for a tenant
export const revokeApiKey = async (tenantId: number) => {
	await drizzle.update(TenantSchema).where({ id: tenantId }).set({ apiKey: null });
	return { success: true };
};
