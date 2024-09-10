// src/models/session.ts
import { sql } from 'drizzle-orm';
import { integer, text, sqliteTable, index, unique } from 'drizzle-orm/sqlite-core';
import { suppliers } from './supplier';
import { buyers } from './buyer';

export const punchOutSessions = sqliteTable('punchout_sessions', {
	id: text('id', { length: 191 }).primaryKey().notNull(),
	buyerId: text('buyer_id')
		.notNull()
		.references(() => buyers.id, { onDelete: 'cascade' }),
	supplierId: text('supplier_id')
		.notNull()
		.references(() => suppliers.id, { onDelete: 'cascade' }),
	sessionStartTime: integer('session_start_time', { mode: 'timestamp_ms' })
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull(),
});
