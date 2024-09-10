import { parseXml } from '@rgrove/parse-xml';
import { z } from 'zod';
import { BuyerSchema, SupplierSchema } from '../models';
import { drizzle } from 'drizzle-orm/d1';
import { publishPunchOutSessionEvent } from '../events/punchoutEventProducer';
// import { publishPunchOutSessionEvent } from '../producers/punchoutSessionProducer';
import { triggerWebhook } from './webhookService';
import { logEvent } from '../models';

// Zod schema for validating PunchOutSetupRequest
// Extended schema for PunchOutSetupRequest validation
const PunchOutSetupRequestSchema = z.object({
	Header: z.object({
		From: z.object({
			Credential: z.string().min(1, 'Missing buyer credential'),
		}),
		To: z.object({
			Credential: z.string().min(1, 'Missing supplier credential'),
		}),
		Sender: z.object({
			Credential: z.string().min(1, 'Missing sender credential'),
			UserAgent: z.string().optional(),
		}),
	}),
	BuyerCookie: z.string().min(1, 'Missing buyer cookie'),
	BrowserFormPost: z.string().url('Invalid URL for BrowserFormPost'),
});

const SESSION_CACHE_TTL = 60 * 5; // 5 minutes

// Parse PunchOutSetupRequest and validate
// Handle PunchOutSetupRequest
export const handlePunchOutSetupRequest = async (xmlString: string) => {
	try {
		const xmlData = parseXml(xmlString);
		const validated = PunchOutSetupRequestSchema.safeParse(xmlData);

		if (!validated.success) {
			throw new Error('Invalid PunchOutSetupRequest: ' + validated.error.message);
		}

		const { Header, BuyerCookie } = validated.data;

		// Lookup buyer, supplier, and tenant credentials
		const buyer = await drizzle.select(BuyerSchema).where({ credential: Header.From.Credential }).first();
		const supplier = await drizzle.select(SupplierSchema).where({ credential: Header.To.Credential }).first();

		if (!buyer || !supplier) {
			throw new Error('Invalid buyer or supplier credentials');
		}

		const tenant = await drizzle.select(TenantSchema).where({ id: buyer?.tenantId }).first();
		if (!tenant) {
			throw new Error('Tenant not found for the buyer');
		}

		// Log the event for audit purposes
		await logEvent('PunchOutSessionStarted', `Session started for buyer ${Header.From.Credential} and supplier ${Header.To.Credential}`);

		// Trigger webhook to notify supplier
		await triggerWebhook(supplier.webhookUrl, {
			event: 'PunchOutSetupRequest',
			buyer: Header.From.Credential,
			supplier: Header.To.Credential,
			buyerCookie: BuyerCookie,
		});

		// Generate PunchOutSetupResponse XML
		const responseXml = `
      <cXML>
        <Response>
          <PunchOutSetupResponse>
            <StartPage>
              <URL>${supplier.catalogUrl}</URL>
            </StartPage>
          </PunchOutSetupResponse>
        </Response>
      </cXML>
    `;

		return {
			success: true,
			responseXml,
		};
	} catch (error: unknown) {
		console.error('Error in PunchOutSetupRequest:', (error as Error).message);

		// Notify via webhook that the session failed
		await triggerWebhook(supplier?.webhookUrl, {
			event: 'PunchOutSetupFailed',
			reason: error.message,
			buyer: Header?.From?.Credential,
			supplier: Header?.To?.Credential,
		});

		// Return structured error response
		return {
			success: false,
			error: `PunchOutSetupRequest failed: ${(error as Error).message}`,
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
