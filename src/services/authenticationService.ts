import { z } from 'zod';
import { drizzle } from 'drizzle-orm/d1';
import { BuyerSchema, SupplierSchema } from '../models';

// Zod schema for cXML header authentication
const cXMLHeaderSchema = z.object({
	To: z.object({
		Credential: z.string(),
	}),
	From: z.object({
		Credential: z.string(),
	}),
	Sender: z.object({
		Credential: z.string(),
		UserAgent: z.string().optional(),
	}),
});

// Authenticate cXML headers
export const authenticateCXMLHeader = async (headers: any) => {
	const validated = cXMLHeaderSchema.safeParse(headers);
	if (!validated.success) {
		throw new Error('Invalid cXML headers: ' + validated.error.message);
	}

	const { From, To } = validated.data;

	// Lookup buyer and supplier credentials from the database
	const buyer = await drizzle.select(BuyerSchema).where({
		credential: From.Credential,
	});

	const supplier = await drizzle.select(SupplierSchema).where({
		credential: To.Credential,
	});

	if (!buyer || !supplier) {
		throw new Error('Invalid buyer or supplier credentials');
	}

	// If authenticated successfully, return the buyer and supplier information
	return {
		buyer,
		supplier,
	};
};
