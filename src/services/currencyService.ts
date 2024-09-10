const CURRENCY_API_URL = 'https://api.exchangerate-api.com/v4/latest/';

export const convertCurrency = async (amount: number, fromCurrency: string, toCurrency: string) => {
	const url = `${CURRENCY_API_URL}${fromCurrency}`;
	const response = await fetch(url);

	if (!response.ok) {
		throw new Error('Currency conversion API failed');
	}

	const rates = (await response.json()) as { rates: Record<string, number> };
	const rate = rates.rates[toCurrency];

	if (!rate) {
		throw new Error(`Currency rate for ${toCurrency} not found`);
	}

	return amount * rate;
};
