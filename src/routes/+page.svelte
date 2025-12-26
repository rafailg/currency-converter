<script lang="ts">
	import { onMount } from 'svelte';
	import { currencyService, type ConversionResult, type CurrencyCode } from '$lib';

	type PairStatus = 'idle' | 'pending' | 'ready';

	type PairState = {
		id: string;
		from?: CurrencyCode;
		to?: CurrencyCode;
		amount: string;
		status: PairStatus;
		result: ConversionResult | null;
	};

	const currencies = currencyService.getCurrencies();
	let pairs: PairState[] = [];

	onMount(() => {
		if (!pairs.length) {
			addPair();
		}
	});

	function addPair() {
		pairs = [
			...pairs,
			{
				id: crypto.randomUUID(),
				amount: '',
				status: 'idle',
				result: null
			}
		];
	}

	function removePair(id: string) {
		pairs = pairs.filter((pair) => pair.id !== id);
	}

	function handleSelect(id: string, key: 'from' | 'to', event: Event) {
		const value = (event.target as HTMLSelectElement).value as CurrencyCode | '';
		const updates = { [key]: value || undefined } as Partial<PairState>;
		pairs = pairs.map((pair) => (pair.id === id ? { ...pair, ...updates } : pair));
		void refreshResult(id);
	}

	function handleAmountInput(id: string, event: Event) {
		const value = (event.target as HTMLInputElement).value;
		pairs = pairs.map((pair) => (pair.id === id ? { ...pair, amount: value } : pair));
		void refreshResult(id);
	}

	async function refreshResult(id: string) {
		const pair = pairs.find((item) => item.id === id);
		if (!pair) return;

		const amount = Number(pair.amount);
		const isReady = pair.from && pair.to && !Number.isNaN(amount) && amount > 0;

		if (!isReady) {
			pairs = pairs.map((p) => (p.id === id ? { ...p, status: 'idle', result: null } : p));
			return;
		}

		pairs = pairs.map((p) => (p.id === id ? { ...p, status: 'pending' } : p));

		const result = await currencyService.convert(amount, pair.from!, pair.to!);

		if (!pairs.some((p) => p.id === id)) return;

		pairs = pairs.map((p) =>
			p.id === id
				? {
					...p,
					status: 'ready',
					result
				}
				: p
		);
	}

	const currencyFormatter = new Intl.NumberFormat('en-US', {
		minimumFractionDigits: 2,
		maximumFractionDigits: 4
	});

	const timeFormatter = new Intl.DateTimeFormat('en-US', {
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit'
	});
</script>

<section class="max-w-6xl mx-auto px-4">
	<header class="py-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
		<div class="space-y-2">
			<p class="uppercase tracking-[0.2em] text-xs text-base-content/60">Currency dashboard</p>
			<h1 class="text-4xl font-bold">Currency converter</h1>
			<p class="text-base text-base-content/70">Add, configure, and monitor multiple exchange pairs side by side.</p>
		</div>
		<div class="badge badge-primary badge-outline badge-lg">Mock data only</div>
	</header>

	<div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
		{#each pairs as pair, index}
			<div class="card bg-base-100 border border-base-300 shadow-xl relative min-h-[260px]">
				<button
					type="button"
					class="btn btn-ghost btn-sm absolute right-3 top-3"
					on:click={() => removePair(pair.id)}
					aria-label="Remove currency pair"
				>
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4">
						<path d="M5 12.75A.75.75 0 0 1 5.75 12h12.5a.75.75 0 0 1 0 1.5H5.75A.75.75 0 0 1 5 12.75Z" />
					</svg>
				</button>

				<div class="card-body space-y-4">
					<div class="flex items-center justify-between">
						<div>
							<p class="text-xs uppercase tracking-wide text-base-content/60">Pair {index + 1}</p>
							<h3 class="text-lg font-semibold">
								{pair.from ?? '—'} / {pair.to ?? '—'}
							</h3>
						</div>
					</div>

					<div class="grid grid-cols-2 gap-3">
						<label class="form-control">
							<div class="label"><span class="label-text">From</span></div>
							<select class="select select-bordered w-full" on:change={(event) => handleSelect(pair.id, 'from', event)}>
								<option value="" selected={!pair.from}>Pick currency</option>
								{#each currencies as currency}
									<option value={currency} selected={pair.from === currency}>{currency}</option>
								{/each}
							</select>
						</label>

						<label class="form-control">
							<div class="label"><span class="label-text">To</span></div>
							<select class="select select-bordered w-full" on:change={(event) => handleSelect(pair.id, 'to', event)}>
								<option value="" selected={!pair.to}>Pick currency</option>
								{#each currencies as currency}
									<option value={currency} selected={pair.to === currency}>{currency}</option>
								{/each}
							</select>
						</label>
					</div>

					<label class="form-control">
						<div class="label flex items-center justify-between">
							<span class="label-text">Amount</span>
							<span class="label-text-alt text-base-content/60">{pair.from ?? 'Currency'}</span>
						</div>
						<input
							type="number"
							class="input input-bordered"
							min="0"
							step="0.01"
							placeholder="0.00"
							value={pair.amount}
							on:input={(event) => handleAmountInput(pair.id, event)}
						/>
					</label>

					{#if pair.status === 'ready' && pair.result}
						<div class="bg-base-200 rounded-2xl p-4 border border-base-300 space-y-1">
							<p class="text-sm text-base-content/70">
								Rate: 1 {pair.result.from} ≈ {currencyFormatter.format(pair.result.rate)} {pair.result.to}
							</p>
							<p class="text-2xl font-bold">
								{currencyFormatter.format(pair.result.converted)} {pair.result.to}
							</p>
							<p class="text-xs text-base-content/60">Updated {timeFormatter.format(pair.result.updatedAt)}</p>
						</div>
					{:else if pair.status === 'pending'}
						<div class="flex items-center gap-2 text-base-content/70">
							<span class="loading loading-spinner loading-sm text-primary"></span>
							<span>Calculating conversion...</span>
						</div>
					{:else}
						<div class="border border-dashed border-base-300 rounded-2xl p-4 text-base-content/70">
							<p class="font-medium">Complete the setup</p>
							<p class="text-sm">Pick both currencies and enter an amount to see the conversion.</p>
						</div>
					{/if}
				</div>
			</div>
		{/each}

		<button
			type="button"
			on:click={addPair}
			class="card bg-base-100 border-2 border-dashed border-base-300 hover:border-primary/70 hover:shadow-xl transition duration-150 min-h-[260px] items-center justify-center text-primary"
			aria-label="Add currency pair"
		>
			<div class="card-body items-center justify-center text-center space-y-2">
				<div class="btn btn-circle btn-outline btn-primary">
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5">
						<path d="M12.75 5.75a.75.75 0 0 0-1.5 0v5.5h-5.5a.75.75 0 0 0 0 1.5h5.5v5.5a.75.75 0 0 0 1.5 0v-5.5h5.5a.75.75 0 0 0 0-1.5h-5.5z" />
					</svg>
				</div>
				<p class="font-semibold text-base-content">Add currency pair</p>
				<p class="text-sm text-base-content/70">Track another conversion at a glance.</p>
			</div>
		</button>
	</div>
</section>
