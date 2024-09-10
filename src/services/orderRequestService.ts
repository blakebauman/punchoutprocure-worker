import { parseXml } from '@rgrove/parse-xml';
import { z } from 'zod';
import { drizzle } from 'drizzle-orm/d1';
import { OrderRequestSchema } from '../models/orderRequest';
import { triggerWebhook } from './webhookService';

// Zod schema for validating OrderRequest
const OrderRequestSchema = z.object({
	OrderRequestHeader: z.object({
		OrderID: z.string(),
		Total: z.object({
			Money: z.object({
				currency: z.string(),
				value: z.string(),
			}),
		}),
	}),
	ItemIn: z.array(
		z.object({
			ItemID: z.string(),
			Quantity: z.number(),
			UnitPrice: z.object({
				Money: z.object({
					currency: z.string(),
					value: z.string(),
				}),
			}),
		})
	),
});

// Handle OrderRequest cXML
export const handleOrderRequest = async (xmlString: string) => {
	try {
		const xmlData = parseXml(xmlString);
		const validated = OrderRequestSchema.safeParse(xmlData);

		if (!validated.success) {
			throw new Error('Invalid OrderRequest: ' + validated.error.message);
		}

		const { OrderRequestHeader, ItemIn } = validated.data;

		// Insert the OrderRequest details into the database
		const orderRequest = await drizzle.insert(OrderRequestSchema).values({
			orderId: OrderRequestHeader.OrderID,
			totalAmount: parseFloat(OrderRequestHeader.Total.Money.value),
			currency: OrderRequestHeader.Total.Money.currency,
			createdAt: new Date(),
		});

		const orderRequestId = orderRequest.insertId;

		// Insert each item into the order request items table
		for (const item of ItemIn) {
			await drizzle.insert(OrderItemSchema).values({
				orderRequestId,
				itemId: item.ItemID,
				quantity: item.Quantity,
				unitPrice: parseFloat(item.UnitPrice.Money.value),
			});
		}

		await triggerWebhook('https://supplier.com/webhook', {
			event: 'OrderSubmitted',
			orderId: orderRequestId,
			buyerId: 'yourBuyerIdValue', // Replace 'yourBuyerIdValue' with the actual value of buyerId
			items: ItemIn,
		});

		// Return success response
		return {
			success: true,
			message: 'OrderRequest processed successfully',
			orderRequestId,
		};
	} catch (error) {
		console.error('Error processing OrderRequest:', error.message);
		return {
			success: false,
			error: `Error processing OrderRequest: ${error.message}`,
		};
	}
};
