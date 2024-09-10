import { drizzle } from 'drizzle-orm/d1';
import { TenantLogSchema } from '../models/log';

// Log tenant activities
export const logTenantActivity = async (tenantId: number, action: string, detail: string) => {
	await drizzle.insert(TenantLogSchema).values({
		tenantId,
		action,
		detail,
		timestamp: new Date(),
	});
};

// Log tenant user activities
export const logTenantUserActivity = async (tenantUserId: number, action: string, detail: string) => {
	await drizzle.insert(TenantLogSchema).values({
		tenantUserId,
		action,
		detail,
		timestamp: new Date(),
	});
};
