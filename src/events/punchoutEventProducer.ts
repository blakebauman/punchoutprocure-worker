export const publishPunchOutSessionEvent = async (env: any, buyerId: string, supplierId: string) => {
	const event = {
		type: 'PunchOutSessionStarted',
		data: {
			buyerId,
			supplierId,
			timestamp: new Date().toISOString(),
		},
	};

	// Publish event to Cloudflare Queues (assuming QUEUE_PUNCHOUT is the environment variable for the queue)
	await env.QUEUE_PUNCHOUT.send(JSON.stringify(event));
};
