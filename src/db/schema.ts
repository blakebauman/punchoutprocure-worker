import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer, primaryKey, unique, index } from 'drizzle-orm/sqlite-core';

export const tenants = sqliteTable(
	'tenants',
	{
		id: text('id', { length: 191 }).primaryKey().notNull(),
		name: text('name'),
		domain: text('domain'), // Unique domain or identifier for the tenant
		config: text('config'),
		createdAt: integer('created_at', { mode: 'timestamp_ms' })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
	},
	(tenants) => ({
		uniqueDomain: unique('domain_unique').on(tenants.domain),
	})
);

export const tenantUsers = sqliteTable('tenant_users', {
	id: text('id', { length: 191 }).primaryKey().notNull(),
	tenantId: text('tenant_id')
		.notNull()
		.references(() => tenants.id, { onDelete: 'cascade' }),
	userId: text('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	role: text('role'),
	createdAt: integer('created_at', { mode: 'timestamp_ms' })
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull(),
});

export const buyers = sqliteTable('buyers', {
	id: text('id', { length: 191 }).primaryKey().notNull(),
	tenantId: text('tenant_id')
		.notNull()
		.references(() => tenants.id, { onDelete: 'cascade' }),
	name: text('name'),
	email: text('email'),
	transactionHistory: text('transaction_history'),
	createdAt: integer('created_at', { mode: 'timestamp_ms' })
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull(),
});

export const suppliers = sqliteTable('suppliers', {
	id: text('id', { length: 191 }).primaryKey().notNull(),
	tenantId: text('tenant_id')
		.notNull()
		.references(() => tenants.id, { onDelete: 'cascade' }),
	name: text('name'),
	catalogUrl: text('catalog_url'),
	punchoutConfig: text('punchout_config'),
	createdAt: integer('created_at', { mode: 'timestamp_ms' })
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull(),
});

export const users = sqliteTable(
	'users',
	{
		id: text('id', { length: 191 }).primaryKey().notNull(),
		name: text('name'),
		email: text('email'),
		createdAt: integer('created_at', { mode: 'timestamp_ms' })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
	},
	(users) => ({
		uniqueEmail: unique('email_unique').on(users.email),
	})
);

export const orders = sqliteTable(
	'orders',
	{
		id: text('id', { length: 191 }).primaryKey().notNull(),
		buyerId: text('buyer_id')
			.notNull()
			.references(() => buyers.id, { onDelete: 'cascade' }),
		buyerCookie: text('buyer_cookie'), // Unique buyerCookie or identifier for the tenant
		totalAmount: text('total_amount'),
		config: text('config'),
		createdAt: integer('created_at', { mode: 'timestamp_ms' })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
	},
	(orders) => ({
		buyerCookieUnique: unique('buyer_cookie_unique').on(orders.buyerCookie),
		buyerIndex: index('buyer_index').on(orders.buyerId),
	})
);

export const orderItems = sqliteTable('order_items', {
	id: text('id', { length: 191 }).primaryKey().notNull(),
	orderId: text('order_id')
		.notNull()
		.references(() => orders.id, { onDelete: 'cascade' }),
	itemId: text('role'),
	quantity: integer('quantity'),
	unitPrice: integer('unit_price'),
	createdAt: integer('created_at', { mode: 'timestamp_ms' })
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull(),
});

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
