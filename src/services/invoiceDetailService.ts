import { parseXml } from '@rgrove/parse-xml';
import { z } from 'zod';
import { drizzle } from 'drizzle-orm/d1';
import { InvoiceSchema } from '../models/invoice';

// Zod schema for validating InvoiceDetailRequest
const InvoiceDetailRequestSchema = z.object({
	InvoiceDetailRequestHeader: z.object({
		InvoiceID: z.string(),
		InvoiceTotal: z.object({
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

// Handle InvoiceDetailRequest cXML
export const handleInvoiceDetailRequest = async (xmlString: string) => {
	try {
		const xmlData = parseXml(xmlString);
		const validated = InvoiceDetailRequestSchema.safeParse(xmlData);

		if (!validated.success) {
			throw new Error('Invalid InvoiceDetailRequest: ' + validated.error.message);
		}

		const { InvoiceDetailRequestHeader, ItemIn } = validated.data;

		// Insert the invoice details into the database
		const invoice = await drizzle.insert(InvoiceSchema).values({
			invoiceId: InvoiceDetailRequestHeader.InvoiceID,
			totalAmount: parseFloat(InvoiceDetailRequestHeader.InvoiceTotal.Money.value),
			currency: InvoiceDetailRequestHeader.InvoiceTotal.Money.currency,
			createdAt: new Date(),
		});

		const invoiceId = invoice.insertId;

		// Insert each item into the invoice items table
		for (const item of ItemIn) {
			await drizzle.insert(OrderItemSchema).values({
				invoiceId,
				itemId: item.ItemID,
				quantity: item.Quantity,
				unitPrice: parseFloat(item.UnitPrice.Money.value),
			});
		}

		// Return success response
		return {
			success: true,
			message: 'Invoice processed successfully',
			invoiceId,
		};
	} catch (error) {
		console.error('Error processing InvoiceDetailRequest:', error.message);
		return {
			success: false,
			error: `Error processing InvoiceDetailRequest: ${error.message}`,
		};
	}
};
