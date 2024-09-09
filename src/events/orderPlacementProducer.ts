export const publishOrderPlacementEvent = async (orderDetails: any) => {
	const event = {
		type: 'OrderPlaced',
		data: {
			orderDetails,
			timestamp: new Date().toISOString(),
		},
	};

	// Publish event to the order processing queue
	await QUEUE_ORDER_PROCESSING.send(JSON.stringify(event));
};
