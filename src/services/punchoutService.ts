import { parseXml } from '@rgrove/parse-xml';
import { z } from 'zod';
import { BuyerSchema, SupplierSchema } from '../models';
import { drizzle } from 'drizzle-orm/d1';

// Zod schema for validation
const PunchOutSetupRequestSchema = z.object({
	Header: z.object({
		From: z.object({
			Credential: z.string(),
		}),
		To: z.object({
			Credential: z.string(),
		}),
		Sender: z.object({
			Credential: z.string(),
			UserAgent: z.string().optional(),
		}),
	}),
	BuyerCookie: z.string(),
	BrowserFormPost: z.string(),
});

const SESSION_CACHE_TTL = 60 * 5; // 5 minutes

// Parse PunchOutSetupRequest and validate
export const handlePunchOutSetupRequest = async (xmlString: string) => {
	try {
		const xmlData = parseXml(xmlString);
		const validated = PunchOutSetupRequestSchema.safeParse(xmlData);

		if (!validated.success) {
			throw new Error(`Invalid PunchOutSetupRequest: ${validated.error.message}`);
		}

		const { Header, BuyerCookie } = validated.data;
		const cacheKey = `punchout-session:${Header.From.Credential}:${Header.To.Credential}`;

		const buyer = await drizzle.select(BuyerSchema).where({
			credential: Header.From.Credential,
		});

		const supplier = await drizzle.select(SupplierSchema).where({
			credential: Header.To.Credential,
		});

		if (!buyer || !supplier) {
			throw new Error('Invalid buyer or supplier credentials');
		}

		const sessionInfo = {
			success: true,
			buyerCookie: BuyerCookie,
			supplierUrl: supplier.catalogUrl,
		};

		// Log the session event
		console.log(`PunchOut session started for buyer ${Header.From.Credential} and supplier ${Header.To.Credential}`);

		return sessionInfo;
	} catch (error) {
		console.error('Error in handlePunchOutSetupRequest:', error.message);
		return {
			success: false,
			error: `Error in handlePunchOutSetupRequest: ${error.message}`,
		};
	}
};

// Create PunchOutSetupResponse XML
export const createPunchOutSetupResponse = async (buyerCookie: string, supplierUrl: string) => {
	const responseXml = `
    <cXML>
      <Response>
        <PunchOutSetupResponse>
          <StartPage>
            <URL>${supplierUrl}</URL>
          </StartPage>
        </PunchOutSetupResponse>
      </Response>
    </cXML>
  `;
	return responseXml;
};

// Handle PunchOutOrderMessage
export const handlePunchOutOrderMessage = async (xmlString: string) => {
	try {
		const xmlData = parseXml(xmlString);

		// Handle the order processing logic here. For example:
		// Extract order items and map them to internal order data structures
		const orderDetails = xmlData?.OrderMessage?.ItemIn?.map((item: any) => ({
			itemId: item.ItemID,
			quantity: item.Quantity,
			unitPrice: item.UnitPrice?.Money?.value,
		}));

		// Store the order in the database for further processing
		// Example: await drizzle.insert(OrderSchema, orderDetails);

		return {
			success: true,
			orderDetails,
		};
	} catch (error) {
		return {
			success: false,
			error: error.message,
		};
	}
};
