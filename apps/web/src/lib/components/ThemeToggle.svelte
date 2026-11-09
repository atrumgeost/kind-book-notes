<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { theme } from '$lib/theme.svelte';
	import MoonIcon from '@lucide/svelte/icons/moon';
	import SunIcon from '@lucide/svelte/icons/sun';

	let next = $derived(theme.resolved === 'dark' ? 'light' : 'dark');
	// Tell people when a click takes them back to following their system setting.
	let label = $derived(
		next === theme.system ? `Switch to ${next} theme (your system setting)` : `Switch to ${next} theme`,
	);
</script>

<Button variant="ghost" size="icon" aria-label={label} title={label} onclick={() => theme.toggle()}>
	{#if next === 'dark'}
		<MoonIcon />
	{:else}
		<SunIcon />
	{/if}
</Button>
