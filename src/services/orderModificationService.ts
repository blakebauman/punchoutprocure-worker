import { drizzle } from 'drizzle-orm/d1';
import { OrderSchema, OrderItemSchema } from '../models/order';

// Modify order by updating quantities or adding/removing items
export const modifyOrder = async (orderId: number, modifications: any[]) => {
	// Fetch the current order
	const order = await drizzle.select(OrderSchema).where({ id: orderId }).first();

	if (!order || order.status !== 'PENDING') {
		throw new Error('Order cannot be modified. It has either been processed or does not exist.');
	}

	// Update existing items or remove them
	for (const modification of modifications) {
		const existingItem = await drizzle
			.select(OrderItemSchema)
			.where({
				orderId,
				itemId: modification.itemId,
			})
			.first();

		if (modification.action === 'update' && existingItem) {
			// Update item quantity and price
			await drizzle
				.update(OrderItemSchema)
				.where({
					orderId,
					itemId: modification.itemId,
				})
				.set({
					quantity: modification.quantity,
					unitPrice: modification.unitPrice,
				});
		} else if (modification.action === 'remove' && existingItem) {
			// Remove item
			await drizzle.delete(OrderItemSchema).where({
				orderId,
				itemId: modification.itemId,
			});
		} else if (modification.action === 'add') {
			// Add a new item to the order
			await drizzle.insert(OrderItemSchema).values({
				orderId,
				itemId: modification.itemId,
				quantity: modification.quantity,
				unitPrice: modification.unitPrice,
			});
		}
	}

	return {
		success: true,
		message: 'Order modified successfully',
	};
};
