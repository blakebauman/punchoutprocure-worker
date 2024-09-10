export const triggerWebhook = async (url: string, payload: any) => {
	try {
		const response = await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(payload),
		});

		if (!response.ok) {
			throw new Error(`Webhook failed with status: ${response.status}`);
		}

		return { success: true };
	} catch (error: unknown) {
		console.error('Error triggering webhook:', (error as Error).message);
		return { success: false, error: (error as Error).message };
	}
};
