<script lang="ts">
	import { DEFAULT_FRONTMATTER, type FrontmatterField } from '@kind-book-notes/parser';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import XIcon from '@lucide/svelte/icons/x';

	interface Props {
		fields: FrontmatterField[];
	}

	let { fields = $bindable() }: Props = $props();

	const variables = ['title', 'subtitle', 'fullTitle', 'author', 'year', 'highlights', 'notes', 'date'];

	function addField() {
		fields.push({ key: '', value: '' });
	}

	function removeField(field: FrontmatterField) {
		fields = fields.filter((f) => f !== field);
	}

	function resetFields() {
		fields = structuredClone(DEFAULT_FRONTMATTER);
	}
</script>

<div class="flex flex-col gap-2">
	<div class="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)_auto] gap-x-1.5 gap-y-1.5">
		<span class="text-muted-foreground px-1 text-xs">Property</span>
		<span class="text-muted-foreground col-span-2 px-1 text-xs">Value</span>
		<!-- Each row is keyed by its object: editing a row mutates it, so the inputs keep focus. -->
		{#each fields as field, i (field)}
			<Input aria-label="Property {i + 1} name" placeholder="rating" bind:value={field.key} class="h-8 font-mono text-xs" />
			<Input aria-label="Property {i + 1} value" placeholder="(left blank)" bind:value={field.value} class="h-8 font-mono text-xs" />
			<Button
				variant="ghost"
				size="icon-sm"
				aria-label="Remove property {field.key || i + 1}"
				onclick={() => removeField(field)}
			>
				<XIcon />
			</Button>
		{/each}
	</div>

	<div class="flex flex-wrap gap-2">
		<Button variant="outline" size="sm" onclick={addField}><PlusIcon /> Add property</Button>
		<Button variant="ghost" size="sm" onclick={resetFields}>Reset to defaults</Button>
	</div>

	<p class="text-muted-foreground text-xs leading-relaxed">
		Use variables from the book:
		{#each variables as name, i (name)}<code class="bg-muted rounded px-1 py-0.5 font-mono text-[0.7rem]">{`{{${name}}}`}</code
			>{i < variables.length - 1 ? ' ' : ''}{/each}. A property whose variable is empty for this book is left out; a
		property you leave blank stays, ready to fill in.
	</p>
</div>
