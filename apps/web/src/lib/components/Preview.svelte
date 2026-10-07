<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { toast } from 'svelte-sonner';
	import CopyIcon from '@lucide/svelte/icons/copy';
	import DownloadIcon from '@lucide/svelte/icons/download';

	interface Props {
		markdown: string;
		fileName: string;
	}

	let { markdown, fileName }: Props = $props();

	async function copy() {
		try {
			await navigator.clipboard.writeText(markdown);
			toast.success('Markdown copied');
		} catch {
			// Some browsers and embedded views refuse clipboard access: select the text so ⌘C / Ctrl+C works.
			const pre = document.getElementById('markdown-preview');
			if (pre) window.getSelection()?.selectAllChildren(pre);
			toast.info('Text selected. Press ⌘C or Ctrl+C to copy it.');
		}
	}

	function download() {
		const url = URL.createObjectURL(new Blob([markdown], { type: 'text/markdown;charset=utf-8' }));
		const link = Object.assign(document.createElement('a'), { href: url, download: fileName });
		link.click();
		// Give the browser a moment to start the download before freeing the file.
		setTimeout(() => URL.revokeObjectURL(url), 1000);
	}
</script>

<div class="flex min-w-0 flex-col gap-3">
	<div class="flex flex-wrap items-center gap-2">
		<Button onclick={copy}><CopyIcon /> Copy Markdown</Button>
		<Button variant="outline" onclick={download}><DownloadIcon /> Download .md</Button>
		<span class="text-muted-foreground min-w-0 truncate font-mono text-xs" title={fileName}>{fileName}</span>
	</div>
	<pre
		id="markdown-preview"
		class="bg-muted/60 border-border max-h-[70vh] overflow-auto rounded-lg border p-4 font-mono text-[0.8rem] leading-relaxed break-words whitespace-pre-wrap"
		aria-label="Markdown preview">{markdown}</pre>
</div>
