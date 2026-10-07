<script lang="ts">
	import * as ToggleGroup from '$lib/components/ui/toggle-group';
	import { theme } from '$lib/theme.svelte';
	import MonitorIcon from '@lucide/svelte/icons/monitor';
	import MoonIcon from '@lucide/svelte/icons/moon';
	import SunIcon from '@lucide/svelte/icons/sun';

	const modes = [
		{ value: 'light', label: 'Light theme', icon: SunIcon },
		{ value: 'dark', label: 'Dark theme', icon: MoonIcon },
		{ value: 'system', label: 'Match system theme', icon: MonitorIcon },
	] as const;
</script>

<ToggleGroup.Root
	type="single"
	size="sm"
	aria-label="Theme"
	bind:value={
		() => theme.choice,
		(next: string) => {
			if (next === 'light' || next === 'dark' || next === 'system') theme.set(next);
		}
	}
>
	{#each modes as { value, label, icon: Icon } (value)}
		<ToggleGroup.Item {value} aria-label={label} title={label}>
			<Icon />
		</ToggleGroup.Item>
	{/each}
</ToggleGroup.Root>
