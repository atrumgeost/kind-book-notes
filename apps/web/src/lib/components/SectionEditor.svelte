<script lang="ts">
	import type { Book } from '@kind-book-notes/parser';
	import { renameSection } from '$lib/book';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';

	interface Props {
		book: Book;
		edited: boolean;
		onchange: (book: Book) => void;
		onundo: () => void;
	}

	let { book, edited, onchange, onundo }: Props = $props();

	const entries = (n: number) => (n === 1 ? '1 entry' : `${n} entries`);
</script>

<div class="flex flex-col gap-2">
	<p class="text-muted-foreground text-xs">
		Edit a name to rename that chapter in the Markdown. Leave it empty to drop the heading.
	</p>
	<ol class="flex flex-col gap-1.5">
		<!-- Keyed by object: renaming replaces the section object. The input commits on change, so focus isn't lost while typing. -->
		{#each book.sections as section, i (section)}
			<li class="flex items-center gap-2">
				<Input
					aria-label="Chapter {i + 1} name"
					placeholder="No heading"
					value={section.title ?? ''}
					onchange={(e) => onchange(renameSection(book, i, e.currentTarget.value))}
					class="h-8 min-w-0 flex-1 text-sm"
				/>
				<span class="text-muted-foreground w-16 shrink-0 text-right text-xs tabular-nums">
					{entries(section.entries.length)}
				</span>
			</li>
		{/each}
	</ol>
	{#if edited}
		<Button variant="outline" size="sm" class="self-start" onclick={onundo}>Undo renames</Button>
	{/if}
</div>
