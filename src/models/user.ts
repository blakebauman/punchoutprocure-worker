import { sql } from 'drizzle-orm';
import { integer, text, sqliteTable, index, unique } from 'drizzle-orm/sqlite-core';

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
