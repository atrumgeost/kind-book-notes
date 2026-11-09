<script lang="ts">
	import { Label } from '$lib/components/ui/label';
	import { Switch } from '$lib/components/ui/switch';

	interface Props {
		id: string;
		label: string;
		hint?: string;
		checked: boolean;
		disabled?: boolean;
	}

	let { id, label, hint, checked = $bindable(), disabled = false }: Props = $props();
</script>

<div class="flex items-start justify-between gap-4">
	<div class="flex min-w-0 flex-col gap-1">
		<Label for={id}>{label}</Label>
		{#if hint}
			<p class="text-muted-foreground text-xs leading-snug">{hint}</p>
		{/if}
	</div>
	<Switch {id} bind:checked {disabled} class="mt-0.5" />
</div>
