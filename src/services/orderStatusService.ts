import { drizzle } from 'drizzle-orm/d1';
import { OrderSchema } from '../models/order';

// Update order status
export const updateOrderStatus = async (orderId: number, status: string) => {
	const order = await drizzle.select(OrderSchema).where({ id: orderId }).first();

	if (!order) {
		throw new Error('Order not found');
	}

	await drizzle.update(OrderSchema).where({ id: orderId }).set({ status });

	return { success: true, message: 'Order status updated successfully' };
};

// Get order status
export const getOrderStatus = async (orderId: number) => {
	const order = await drizzle.select(OrderSchema).where({ id: orderId }).first();

	if (!order) {
		throw new Error('Order not found');
	}

	return { status: order.status };
};
