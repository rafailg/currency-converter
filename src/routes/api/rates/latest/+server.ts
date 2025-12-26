import { json } from '@sveltejs/kit';
import { EXCHANGE_API_KEY } from '$env/static/private';

const API_BASE = 'https://v6.exchangerate-api.com/v6';

export async function GET({ url, fetch }) {
	if (!EXCHANGE_API_KEY) {
		return json({ error: 'Missing EXCHANGE_API_KEY' }, { status: 500 });
	}

	const base = (url.searchParams.get('base') ?? 'USD').toUpperCase();
	const upstream = await fetch(`${API_BASE}/${EXCHANGE_API_KEY}/latest/${base}`);
	const data = await upstream.json();

	return json(data, { status: upstream.status });
}
