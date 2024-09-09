export const processPunchOutEvent = async (event: any) => {
	try {
		const parsedEvent = JSON.parse(event);

		if (parsedEvent.type === 'PunchOutSessionStarted') {
			const { buyerId, supplierId, timestamp } = parsedEvent.data;

			// Log or process the event, e.g., create audit logs, send notifications, etc.
			console.log(`PunchOut session started for buyer ${buyerId} and supplier ${supplierId} at ${timestamp}`);

			// Example: Store session info in the database (can add more logic here)
		}
	} catch (error) {
		console.error('Error processing PunchOut event:', error);
	}
};
