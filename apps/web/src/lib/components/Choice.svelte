<script lang="ts" generics="T extends string">
	import * as ToggleGroup from '$lib/components/ui/toggle-group';

	interface Props {
		id: string;
		label: string;
		options: { value: T; label: string }[];
		value: T;
		onchange?: (value: T) => void;
	}

	let { id, label, options, value = $bindable(), onchange }: Props = $props();
</script>

<div class="flex flex-col gap-1.5">
	<span id="{id}-label" class="text-sm font-medium">{label}</span>
	<ToggleGroup.Root
		type="single"
		variant="outline"
		size="sm"
		aria-labelledby="{id}-label"
		class="w-full flex-wrap"
		bind:value={
			() => value,
			(next: string) => {
				// A single toggle group lets you click the active item to clear it; a setting always needs a value.
				if (!next) return;
				value = next as T;
				onchange?.(value);
			}
		}
	>
		{#each options as option (option.value)}
			<ToggleGroup.Item value={option.value} class="flex-1 px-2.5">{option.label}</ToggleGroup.Item>
		{/each}
	</ToggleGroup.Root>
</div>
