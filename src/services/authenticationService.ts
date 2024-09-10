import { z } from 'zod';
import { drizzle } from 'drizzle-orm/d1';
import { buyers, suppliers } from '../models';
import { eq } from 'drizzle-orm';

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

// Authenticate cXML headers and check validity
export const authenticateCXMLHeader = async (headers: any) => {
	const validated = cXMLHeaderSchema.safeParse(headers);

	if (!validated.success) {
		throw new Error('Invalid cXML headers: ' + validated.error.message);
	}

	const { From, To } = validated.data;

	// Check if buyer and supplier credentials are valid
	const buyer = await db.select().from(buyers).where(eq(buyers.credential, From.Credential)).get();
	const supplier = await db.select().from(suppliers).where(eq(suppliers.credential, To.Credential)).get();

	if (!buyer || !supplier) {
		throw new Error('Invalid buyer or supplier credentials');
	}

	// Optional: Perform signature validation or integrity check
	// Add additional security checks here (e.g., verify that the request is from a trusted source)

	return { buyer, supplier };
};
