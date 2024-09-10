import { drizzle } from 'drizzle-orm/d1';
import { tenants } from '../models/tenant';
import { randomBytes } from 'node:crypto';

// Generate an API key for a tenant user
export const generateUserApiKey = (): string => {
	return randomBytes(32).toString('hex');
};

// Create a new tenant user with an API key and role
export const createTenantUser = async (tenantId: number, userId: number, role: string) => {
	const apiKey = generateUserApiKey();
	await drizzle.insert(TenantUserSchema).values({
		tenantId,
		userId,
		apiKey,
		role,
		createdAt: new Date(),
	});
	return { success: true, apiKey };
};

// Validate API key for tenant users
export const validateUserApiKey = async (apiKey: string) => {
	const tenantUser = await drizzle.select(TenantUserSchema).where({ apiKey }).first();
	return tenantUser ? tenantUser : null;
};

// Update tenant user's role
export const updateTenantUser = async (userId: number, email: string, role: string) => {
	await drizzle.update(TenantUserSchema).where({ userId }).set({ role });
	return { success: true };
};

// Delete a tenant user
export const deleteTenantUser = async (userId: number) => {
	await drizzle.delete(TenantUserSchema).where({ userId });
	return { success: true };
};

// Rotate the API key for a tenant
export const rotateUserApiKey = async (tenantId: number) => {
	const newApiKey = generateUserApiKey();

	await drizzle.update(TenantUserSchema).where({ id: tenantId }).set({ apiKey: newApiKey });

	return { success: true, apiKey: newApiKey };
};
