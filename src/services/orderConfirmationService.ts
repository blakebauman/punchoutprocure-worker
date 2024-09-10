import { drizzle } from 'drizzle-orm/d1';
import { OrderSchema } from '../models/order';
import { logEvent } from '../models/auditLog';

// Confirm or reject an order
// confirmation flow where the supplier can either confirm or reject the PunchOut order after reviewing it.
export const confirmOrder = async (orderId: number, status: 'confirmed' | 'rejected', reason?: string) => {
	const order = await drizzle.select(OrderSchema).where({ id: orderId }).first();

	if (!order) {
		throw new Error('Order not found');
	}

	if (order.status !== 'PENDING') {
		throw new Error('Order cannot be modified');
	}

	// Update the order status
	await drizzle
		.update(OrderSchema)
		.where({ id: orderId })
		.set({
			status,
			rejectionReason: status === 'rejected' ? reason : null,
		});

	// Log the event
	const eventType = status === 'confirmed' ? 'OrderConfirmed' : 'OrderRejected';
	await logEvent(eventType, `Order ${orderId} ${status}`);

	return { success: true, message: `Order ${status} successfully` };
};
