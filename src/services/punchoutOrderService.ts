import { parseXml } from '@rgrove/parse-xml';
import { z } from 'zod';
import { drizzle } from 'drizzle-orm/d1';
import { OrderSchema, OrderItemSchema } from '../models/order';
import { publishOrderPlacementEvent } from '../events/orderPlacementProducer';
import { retry } from '../utils/retry';
import { acquireLock, releaseLock } from '../utils/lock';
import { convertCurrency } from './currencyService';
import { logEvent } from '../models/auditLog';

// Zod schema for validating PunchOutOrderMessage
const PunchOutOrderMessageSchema = z.object({
	PunchOutOrderMessageHeader: z.object({
		Total: z.object({
			Money: z.object({
				currency: z.string(),
				value: z.string(),
			}),
		}),
		Discount: z
			.object({
				Money: z.object({
					currency: z.string(),
					value: z.string(),
				}),
			})
			.optional(),
		Tax: z
			.object({
				Money: z.object({
					currency: z.string(),
					value: z.string(),
				}),
			})
			.optional(),
	}),
	BuyerCookie: z.string(),
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
			ItemType: z.enum(['physical', 'digital', 'service']).optional(),
		})
	),
});

// Handle PunchOutOrderMessage
export const handlePunchOutOrderMessage = async (xmlString: string) => {
	try {
		const xmlData = parseXml(xmlString);
		const validated = PunchOutOrderMessageSchema.safeParse(xmlData);

		if (!validated.success) {
			throw new Error('Invalid PunchOutOrderMessage: ' + validated.error.message);
		}

		const { PunchOutOrderMessageHeader, BuyerCookie, ItemIn } = validated.data;

		const lockKey = `lock:buyer:${BuyerCookie}`;
		const lockAcquired = await acquireLock(lockKey, 5000);

		if (!lockAcquired) {
			throw new Error('Order is already being processed for this buyer');
		}

		// Extract order details
		const totalAmount = parseFloat(PunchOutOrderMessageHeader.Total.Money.value);
		const currency = PunchOutOrderMessageHeader.Total.Money.currency;

		const totalAmountUSD = 1000; // Example amount in USD
		const buyerCurrency = 'EUR';

		// convert the total amount to the buyer’s currency
		const totalInBuyerCurrency = await convertCurrency(totalAmountUSD, 'USD', buyerCurrency);

		// Insert the order into the database
		const order = await drizzle.insert(OrderSchema).values({
			buyerCookie: BuyerCookie,
			totalAmount: parseFloat(PunchOutOrderMessageHeader.Total.Money.value),
			discountAmount: PunchOutOrderMessageHeader.Discount ? parseFloat(PunchOutOrderMessageHeader.Discount.Money.value) : 0,
			taxAmount: PunchOutOrderMessageHeader.Tax ? parseFloat(PunchOutOrderMessageHeader.Tax.Money.value) : 0,
			currency,
			createdAt: new Date(),
		});

		const orderId = order.insertId;

		// Insert each item into the database
		// for (const item of ItemIn) {
		// 	await drizzle.insert(OrderItemSchema).values({
		// 		orderId,
		// 		itemId: item.ItemID,
		// 		quantity: item.Quantity,
		// 		unitPrice: parseFloat(item.UnitPrice.Money.value),
		// 	});
		// }

		// Batch insert order items
		const batchResult = await retry(() => insertOrderItemsInBatch(ItemIn, orderId), 3, 1000);

		if (!batchResult.success) {
			throw new Error(`Error inserting order items: ${batchResult.error}`);
		}

		// Log and publish order placement event
		console.log(`Order placed with orderId ${orderId}`);
		await publishOrderPlacementEvent(orderId);

		// Generate and return PunchOutOrderMessage response
		const responseXml = `
      <cXML>
        <Response>
          <Status code="200" text="Order Processed Successfully"/>
        </Response>
      </cXML>
    `;
		// Log the order event
		await logEvent('OrderPlaced', `Order placed with ID ${orderId}`);

		await releaseLock(lockKey);

		return {
			success: true,
			responseXml,
		};
	} catch (error: unknown) {
		console.error('Error processing PunchOutOrderMessage:', (error as Error).message);
		return {
			success: false,
			error: `Error processing PunchOutOrderMessage: ${(error as Error).message}`,
		};
	}
};

// Insert order items in batches
export const insertOrderItemsInBatch = async (items: any[], orderId: number) => {
	try {
		const values = items.map((item) => ({
			orderId,
			itemId: item.ItemID,
			quantity: item.Quantity,
			unitPrice: parseFloat(item.UnitPrice.Money.value),
			itemType: item.ItemType || 'physical',
		}));

		// Batch insert all items
		await drizzle.insert(OrderItemSchema).values(values);
		return { success: true };
	} catch (error) {
		console.error('Error in batch insert for order items:', (error as Error).message);
		return { success: false, error: (error as Error).message };
	}
};

// Fetch orders scoped to a specific tenant
export const getOrdersForTenant = async (tenantId: number) => {
	return await drizzle.select(OrderSchema).where({ tenantId }).all();
};
