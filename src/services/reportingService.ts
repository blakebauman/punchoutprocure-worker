import { drizzle } from 'drizzle-orm/d1';
import { AuditLogSchema } from '../models/auditLog';

// Generate a report of PunchOut sessions and orders
export const generateReport = async (tenantId: string) => {
	const punchOutSessions = await drizzle
		.select(AuditLogSchema)
		.where({
			eventType: 'PunchOutSessionStarted',
			tenantId,
		})
		.count();

	const ordersPlaced = await drizzle
		.select(AuditLogSchema)
		.where({
			eventType: 'OrderPlaced',
			tenantId,
		})
		.count();

	const invoicesProcessed = await drizzle
		.select(AuditLogSchema)
		.where({
			eventType: 'InvoiceProcessed',
			tenantId,
		})
		.count();

	return {
		punchOutSessions,
		ordersPlaced,
		invoicesProcessed,
	};
};

export const generatePaginatedReport = async (tenantId: string, page = 1, pageSize = 10) => {
	const offset = (page - 1) * pageSize;

	const punchOutSessions = await drizzle
		.select(AuditLogSchema)
		.where({
			eventType: 'PunchOutSessionStarted',
			tenantId,
		})
		.limit(pageSize)
		.offset(offset)
		.count();

	const ordersPlaced = await drizzle
		.select(AuditLogSchema)
		.where({
			eventType: 'OrderPlaced',
			tenantId,
		})
		.limit(pageSize)
		.offset(offset)
		.count();

	return {
		punchOutSessions,
		ordersPlaced,
		page,
		pageSize,
	};
};
