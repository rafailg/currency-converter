export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CAD' | 'AUD' | 'CHF';

export type ConversionResult = {
	from: CurrencyCode;
	to: CurrencyCode;
	rate: number;
	amount: number;
	converted: number;
	updatedAt: Date;
};

const MOCK_RATES: Record<CurrencyCode, number> = {
	USD: 1,
	EUR: 0.91,
	GBP: 0.78,
	JPY: 147.2,
	CAD: 1.33,
	AUD: 1.52,
	CHF: 0.86
};

export class CurrencyService {
	private currencies: CurrencyCode[] = Object.keys(MOCK_RATES) as CurrencyCode[];

	getCurrencies(): CurrencyCode[] {
		return this.currencies;
	}

	async convert(amount: number, from: CurrencyCode, to: CurrencyCode): Promise<ConversionResult> {
		const fromRate = MOCK_RATES[from];
		const toRate = MOCK_RATES[to];

		const usdValue = amount / fromRate;
		const converted = usdValue * toRate;

		return {
			from,
			to,
			rate: toRate / fromRate,
			amount,
			converted,
			updatedAt: new Date()
		};
	}
}

export const currencyService = new CurrencyService();
