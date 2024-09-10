export const retry = async (fn: () => Promise<any>, retries = 3, delay = 1000): Promise<any> => {
	try {
		return await fn();
	} catch (error) {
		if (retries === 0) {
			throw new Error(`Failed after ${retries} retries: ${(error as Error).message}`);
		}
		console.warn(`Retrying... Attempts left: ${retries}`);
		await new Promise((res) => setTimeout(res, delay));
		return retry(fn, retries - 1, delay * 2); // Exponential backoff
	}
};
