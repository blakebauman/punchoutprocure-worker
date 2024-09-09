import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core';

import { tenants } from './tenant';

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
