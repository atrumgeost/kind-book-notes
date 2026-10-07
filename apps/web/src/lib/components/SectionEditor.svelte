<script lang="ts">
	import type { Book } from '@kind-book-notes/parser';
	import { mergeWithNext, renameSection } from '$lib/book';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import MergeIcon from '@lucide/svelte/icons/merge';

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
		Rename a chapter by editing its name. Merge folds the next chapter into this one, which helps when Kindle splits a
		chapter in two.
	</p>
	<ol class="flex flex-col gap-1.5">
		<!-- Keyed by object: renaming and merging replace the section objects, which is what we want here. -->
		{#each book.sections as section, i (section)}
			<li class="flex flex-col gap-1.5">
				<div class="flex items-center gap-2">
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
				</div>
				{#if i < book.sections.length - 1}
					<Button
						variant="ghost"
						size="xs"
						class="text-muted-foreground self-start"
						onclick={() => onchange(mergeWithNext(book, i))}
					>
						<MergeIcon /> Merge with next
					</Button>
				{/if}
			</li>
		{/each}
	</ol>
	{#if edited}
		<Button variant="outline" size="sm" class="self-start" onclick={onundo}>Undo chapter edits</Button>
	{/if}
</div>
