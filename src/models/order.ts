import { sql } from 'drizzle-orm';
import { integer, text, sqliteTable, index, unique } from 'drizzle-orm/sqlite-core';
import { buyers } from './buyer';

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
