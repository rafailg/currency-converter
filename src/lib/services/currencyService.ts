export type CurrencyCode = string;

export type ConversionResult = {
	from: CurrencyCode;
	to: CurrencyCode;
	rate: number;
	amount: number;
	converted: number;
	updatedAt: Date;
};

type LatestResponse = {
	result: 'success' | 'error';
	conversion_rates?: Record<CurrencyCode, number>;
	error?: string;
};

type PairResponse = {
	result: 'success' | 'error';
	conversion_rate?: number;
	error?: string;
};

const API_BASE = '/api/rates';

export class CurrencyService {
	private currencies: CurrencyCode[] = [];
	private pairCache = new Map<string, number>();

	async loadCurrencies(base: CurrencyCode = 'USD'): Promise<CurrencyCode[]> {
		const res = await fetch(`${API_BASE}/latest?base=${encodeURIComponent(base)}`);
		if (!res.ok) {
			throw new Error('Failed to load currencies');
		}
		const data = (await res.json()) as LatestResponse;

		if (data.result !== 'success' || !data.conversion_rates) {
			throw new Error(data.error ?? 'Failed to load currencies');
		}

		this.currencies = Object.keys(data.conversion_rates);
		return this.currencies;
	}

	getCurrencies(): CurrencyCode[] {
		return this.currencies;
	}

	private cacheKey(from: CurrencyCode, to: CurrencyCode): string {
		return `${from}->${to}`;
	}

	async convert(amount: number, from: CurrencyCode, to: CurrencyCode): Promise<ConversionResult> {
		const key = this.cacheKey(from, to);
		let rate = this.pairCache.get(key);

		if (rate === undefined) {
			const res = await fetch(
				`${API_BASE}/pair?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
			);
			if (!res.ok) {
				throw new Error('Failed to fetch pair conversion');
			}
			const data = (await res.json()) as PairResponse;

			if (data.result !== 'success' || data.conversion_rate === undefined) {
				throw new Error(data.error ?? 'Failed to fetch pair conversion');
			}

			rate = data.conversion_rate;
			this.pairCache.set(key, rate);
		}

		return {
			from,
			to,
			rate,
			amount,
			converted: amount * rate,
			updatedAt: new Date()
		};
	}
}

export const currencyService = new CurrencyService();
