import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer, primaryKey, unique } from 'drizzle-orm/sqlite-core';

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
