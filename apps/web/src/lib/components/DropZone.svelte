<script lang="ts">
	import FileUpIcon from '@lucide/svelte/icons/file-up';

	interface Props {
		/** Smaller version shown once a book is loaded. */
		compact?: boolean;
		onfile: (html: string, fileName: string) => void;
	}

	let { compact = false, onfile }: Props = $props();

	let dragging = $state(false);

	async function read(files: FileList | null | undefined) {
		const file = files?.[0];
		if (!file) return;
		// file.text() reads the file locally; nothing is sent anywhere.
		onfile(await file.text(), file.name);
	}
</script>

<label
	for="kindle-file"
	class={[
		'group relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed text-center transition-colors',
		'focus-within:ring-ring/50 focus-within:ring-3',
		compact ? 'px-4 py-4 sm:flex-row sm:gap-3' : 'px-6 py-10 sm:py-14',
		dragging ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/60 hover:bg-muted/50',
	]}
	ondragenter={(e) => {
		e.preventDefault();
		dragging = true;
	}}
	ondragover={(e) => e.preventDefault()}
	ondragleave={() => (dragging = false)}
	ondrop={(e) => {
		e.preventDefault();
		dragging = false;
		read(e.dataTransfer?.files);
	}}
>
	<FileUpIcon class={['text-primary shrink-0', compact ? 'size-5' : 'size-9']} aria-hidden="true" />
	{#if compact}
		<span class="text-sm"><strong class="font-semibold">Drop another export</strong> or click to choose a file</span>
	{:else}
		<span class="font-heading text-xl font-semibold text-balance">Drop your Kindle notebook export here</span>
		<span class="text-muted-foreground max-w-md text-sm text-balance">
			or click to choose the <code class="font-mono text-xs">.html</code> file. In the Kindle app, open a book’s Notebook
			and choose Export → HTML.
		</span>
	{/if}
	<input
		id="kindle-file"
		type="file"
		accept=".html,.htm,text/html"
		class="sr-only"
		onchange={(e) => {
			read(e.currentTarget.files);
			// Reset so choosing the same file again still triggers a change.
			e.currentTarget.value = '';
		}}
	/>
</label>
