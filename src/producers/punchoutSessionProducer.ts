// src/producers/punchoutSessionProducer.ts
export const publishPunchOutSessionEvent = async (queue: Queue, buyerId: string, supplierId: string) => {
	const eventPayload = {
		eventType: 'PunchOutSessionStarted',
		buyerId,
		supplierId,
		timestamp: new Date().toISOString(),
	};

	try {
		// Publish the event to the queue
		await queue.send(eventPayload);
		console.log('PunchOut session event published successfully.');
	} catch (error) {
		console.error('Failed to publish PunchOut session event:', error);
	}
};
