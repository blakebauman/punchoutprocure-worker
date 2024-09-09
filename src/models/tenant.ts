import { sql } from 'drizzle-orm';
import { integer, text, sqliteTable, index, unique } from 'drizzle-orm/sqlite-core';

import { users } from './user';

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
		.references(() => users.id, { onDelete: 'cascade' }), // TODO: User ID from the auth service?
	role: text('role'),
	createdAt: integer('created_at', { mode: 'timestamp_ms' })
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull(),
});
