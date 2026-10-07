<script lang="ts">
	import { bookVariables, suggestedFileName, toMarkdown, type Book } from '@kind-book-notes/parser';
	import { readKindleExport } from '$lib/book';
	import { defaultSettings, loadSettings, saveSettings } from '$lib/settings';
	import { applyTheme } from '$lib/theme.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Toaster } from '$lib/components/ui/sonner';
	import DropZone from '$lib/components/DropZone.svelte';
	import OptionsPanel from '$lib/components/OptionsPanel.svelte';
	import Preview from '$lib/components/Preview.svelte';
	import SectionEditor from '$lib/components/SectionEditor.svelte';
	import ThemeSwitcher from '$lib/components/ThemeSwitcher.svelte';
	import LockIcon from '@lucide/svelte/icons/lock';
	import SlidersIcon from '@lucide/svelte/icons/sliders-horizontal';
	// An invented book with the same structure as a real export, so the page shows what it does before you drop a file.
	import sampleHtml from '../../../fixtures/synthetic/two-level.html?raw';

	applyTheme();

	let settings = $state(loadSettings());
	// Syncing to localStorage is what effects are for; saveSettings never touches component state.
	$effect(() => saveSettings($state.snapshot(settings)));

	// Parsed books are only ever replaced, never mutated, so they don't need deep reactivity.
	const sample = readKindleExport(sampleHtml);
	let original: Book = $state.raw(sample);
	// `book` holds chapter edits; `original` is what "Undo chapter edits" goes back to.
	let book: Book = $state.raw(sample);
	let isSample = $state(true);
	let error = $state('');
	let optionsOpen = $state(false);

	const today = new Date().toISOString().slice(0, 10);
	let markdown = $derived(toMarkdown(book, { ...settings, date: today }));
	let fileName = $derived(suggestedFileName(book));
	// Same counts as the {{highlights}} and {{notes}} properties, so the badges never disagree with the output.
	let stats = $derived(bookVariables(book, { ...settings, date: today }));

	const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

	function loadFile(html: string, name: string) {
		try {
			original = readKindleExport(html);
			book = original;
			isSample = false;
			error = '';
		} catch (e) {
			error = e instanceof Error ? `${name}: ${e.message}` : `${name} couldn’t be read.`;
		}
	}
</script>

<Toaster position="bottom-center" />

<div class="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-10">
	<header class="flex flex-wrap items-start justify-between gap-4">
		<div class="flex min-w-0 flex-col gap-1.5">
			<h1 class="font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
				Kind Book Notes
			</h1>
			<p class="text-muted-foreground max-w-prose text-balance">
				Turn your Kindle highlights and notes into clean Markdown for Obsidian or any notes app.
			</p>
		</div>
		<ThemeSwitcher />
	</header>

	<p class="bg-muted/60 flex items-start gap-2 self-start rounded-lg px-3 py-2 text-sm">
		<LockIcon class="text-primary mt-0.5 size-4 shrink-0" aria-hidden="true" />
		<span>Your files never leave this browser. They’re converted on your device, and nothing is uploaded.</span>
	</p>

	<DropZone compact={!isSample} onfile={loadFile} />

	{#if error}
		<p role="alert" class="border-destructive/40 bg-destructive/10 text-destructive rounded-lg border px-4 py-3 text-sm">
			{error}
		</p>
	{/if}

	<div class="grid items-start gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
		<aside class="bg-card border-border flex flex-col gap-4 rounded-xl border p-4 lg:sticky lg:top-4">
			<button
				type="button"
				class="flex items-center justify-between gap-2 text-left lg:pointer-events-none"
				aria-expanded={optionsOpen}
				aria-controls="options-panel"
				onclick={() => (optionsOpen = !optionsOpen)}
			>
				<span class="flex items-center gap-2 font-semibold"><SlidersIcon class="size-4" aria-hidden="true" /> Options</span>
				<span class="text-muted-foreground text-xs lg:hidden">{optionsOpen ? 'Hide' : 'Show'}</span>
			</button>
			<div id="options-panel" class={[!optionsOpen && 'hidden', 'lg:block']}>
				<OptionsPanel bind:settings onreset={() => (settings = defaultSettings())} />
			</div>
		</aside>

		<main class="flex min-w-0 flex-col gap-4">
			<div class="flex flex-col gap-2">
				<div class="flex flex-wrap items-center gap-2">
					{#if isSample}<Badge variant="secondary">Sample book</Badge>{/if}
					<Badge variant="outline" class="tabular-nums">{plural(Number(stats.highlights), 'highlight', 'highlights')}</Badge>
					<Badge variant="outline" class="tabular-nums">{plural(Number(stats.notes), 'note', 'notes')}</Badge>
				</div>
				<h2 class="font-heading text-2xl font-semibold text-balance">{book.title}</h2>
				{#if book.authors.length}<p class="text-muted-foreground -mt-1">{book.authors.join(', ')}</p>{/if}
				{#if isSample}
					<p class="text-muted-foreground text-sm">This is an invented example. Drop your own export above to convert it.</p>
				{/if}
			</div>

			<details class="border-border group rounded-xl border px-4 py-3">
				<summary class="cursor-pointer text-sm font-semibold select-none">
					Chapters <span class="text-muted-foreground font-normal">({book.sections.length}) · rename or merge</span>
				</summary>
				<div class="pt-3">
					<SectionEditor
						{book}
						edited={book !== original}
						onchange={(next) => (book = next)}
						onundo={() => (book = original)}
					/>
				</div>
			</details>

			<Preview {markdown} {fileName} />
		</main>
	</div>

	<footer class="text-muted-foreground border-border border-t pt-4 text-xs">
		Open source under AGPL-3.0. Maintained in spare time.
	</footer>
</div>
