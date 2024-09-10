import { sql } from 'drizzle-orm';
import { integer, text, sqliteTable, index, unique } from 'drizzle-orm/sqlite-core';
import { buyers } from './buyer';

export const auditLogs = sqliteTable(
	'audit_logs',
	{
		id: text('id', { length: 191 }).primaryKey().notNull(),
		eventType: text('event_type').notNull(),
		description: text('domain'),
		createdAt: integer('created_at', { mode: 'timestamp_ms' })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
	},
	(auditLogs) => ({
		eventTypeIndex: index('event_type_index').on(auditLogs.eventType),
	})
);

export const auditLogsRateLimits = sqliteTable(
	'audit_logs_rate_limits',
	{
		id: text('id', { length: 191 }).primaryKey().notNull(),
		buyerId: text('buyer_id')
			.notNull()
			.references(() => buyers.id, { onDelete: 'cascade' }),
		requestCount: integer('request_count').notNull(),
		lastRequestTime: integer('last_request_time', { mode: 'timestamp_ms' })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
	},
	(auditLogsRateLimits) => ({
		auditLogsRateLimitsIndex: index('buyer_id_rate_limit_index').on(auditLogsRateLimits.buyerId),
	})
);

// Helper to insert an audit log
export const logEvent = async (eventType: string, description: string) => {
	await env.DB.db
		.insert(auditLogs)
		.values({
			eventType,
			description,
		})
		.run();
};
