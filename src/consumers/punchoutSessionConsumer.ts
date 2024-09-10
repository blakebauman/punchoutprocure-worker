// src/consumers/punchoutSessionConsumer.ts
import { drizzle } from 'drizzle-orm/d1';
import { PunchOutSessionSchema } from '../models/session';

// Consumer that processes PunchOut session events
export const processPunchOutSessionEvent = async (event: any) => {
	const { buyerId, supplierId, timestamp } = event;

	try {
		// Log or store the PunchOut session details in D1
		await drizzle.insert(PunchOutSessionSchema).values({
			buyerId,
			supplierId,
			sessionStartTime: new Date(timestamp),
		});

		console.log('PunchOut session processed and stored successfully.');
	} catch (error) {
		console.error('Error processing PunchOut session event:', error);
	}
};
