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
const CACHE_STORAGE_KEY = 'cc-rate-cache-v1';

export class CurrencyService {
	private currencies: CurrencyCode[] = [];
	private pairCache = new Map<string, number>();
	private cacheLoaded = false;

	private ensureCacheLoaded() {
		if (this.cacheLoaded) return;
		if (typeof localStorage === 'undefined') return;
		this.cacheLoaded = true;
		const raw = localStorage.getItem(CACHE_STORAGE_KEY);
		if (!raw) return;
		try {
			const parsed = JSON.parse(raw) as Record<string, number>;
			Object.entries(parsed).forEach(([key, value]) => {
				if (typeof value === 'number' && Number.isFinite(value)) {
					this.pairCache.set(key, value);
				}
			});
		} catch (error) {
			console.warn('Failed to read cached rates from storage', error);
		}
	}

	private persistCache() {
		if (typeof localStorage === 'undefined') return;
		const entries = Object.fromEntries(this.pairCache.entries());
		localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(entries));
	}

	async loadCurrencies(base: CurrencyCode = 'USD'): Promise<CurrencyCode[]> {
		this.ensureCacheLoaded();
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
		this.ensureCacheLoaded();
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
			this.persistCache();
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
