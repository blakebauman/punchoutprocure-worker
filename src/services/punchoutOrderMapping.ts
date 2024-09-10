import { parseXml } from '@rgrove/parse-xml';
import { drizzle } from 'drizzle-orm/d1';
import { OrderSchema, OrderItemSchema } from '../models/order';

// Parse and map the PunchOutOrderMessage cXML to internal structure
export const mapPunchOutOrderMessage = async (xmlString: string) => {
	// Parse the incoming XML string
	const xmlData = parseXml(xmlString);

	// Extract relevant order details
	const orderHeader = xmlData.PunchOutOrderMessageHeader;
	const items = xmlData.ItemIn; // Array of items in the order

	// Map order header details to the internal structure
	const order = {
		totalAmount: parseFloat(orderHeader.Total.Money.value),
		currency: orderHeader.Total.Money.currency,
		buyerCookie: xmlData.BuyerCookie,
		createdAt: new Date(),
	};

	// Insert the order into the D1 database
	const newOrder = await drizzle.insert(OrderSchema).values(order);
	const orderId = newOrder.insertId;

	// Map and insert each order line item
	for (const item of items) {
		const orderItem = {
			orderId: orderId,
			itemId: item.ItemID,
			quantity: item.Quantity,
			unitPrice: parseFloat(item.UnitPrice.Money.value),
			currency: item.UnitPrice.Money.currency,
			description: item.ItemDetail.Description,
		};

		// Insert the item into the D1 database
		await drizzle.insert(OrderItemSchema).values(orderItem);
	}

	return { success: true, orderId };
};
