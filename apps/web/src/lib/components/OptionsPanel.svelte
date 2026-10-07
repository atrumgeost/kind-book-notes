<script lang="ts">
	import type { Settings } from '$lib/settings';
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';
	import Choice from './Choice.svelte';
	import FrontmatterEditor from './FrontmatterEditor.svelte';
	import SwitchRow from './SwitchRow.svelte';

	interface Props {
		settings: Settings;
		onreset: () => void;
	}

	// The panel edits the settings in place, so App binds them (bind:settings).
	let { settings = $bindable(), onreset }: Props = $props();

	function onTitleChange(title: Settings['titleHeading']) {
		// Chapters default to one level below the title (H2 when there's no title heading).
		settings.chapterLevel = title === 'h2' ? 3 : 2;
	}
</script>

{#snippet group(title: string)}
	<h3 class="text-muted-foreground text-xs font-semibold tracking-wider uppercase">{title}</h3>
{/snippet}

<div class="flex flex-col gap-5">
	<section class="flex flex-col gap-4" aria-label="Structure">
		{@render group('Structure')}
		<Choice
			id="title-heading"
			label="Book title"
			bind:value={settings.titleHeading}
			onchange={onTitleChange}
			options={[
				{ value: 'h1', label: 'H1' },
				{ value: 'h2', label: 'H2' },
				{ value: 'none', label: 'None' },
			]}
		/>
		<Choice
			id="chapter-level"
			label="Chapters"
			bind:value={
				() => String(settings.chapterLevel) as '1' | '2' | '3' | '4',
				(v) => (settings.chapterLevel = Number(v) as Settings['chapterLevel'])
			}
			options={[
				{ value: '1', label: 'H1' },
				{ value: '2', label: 'H2' },
				{ value: '3', label: 'H3' },
				{ value: '4', label: 'H4' },
			]}
		/>
		<Choice
			id="separator"
			label="Between highlights"
			bind:value={settings.separator}
			options={[
				{ value: 'rule', label: 'Line ---' },
				{ value: 'blank', label: 'Blank line' },
				{ value: 'location', label: 'Location' },
			]}
		/>
		<Choice
			id="location"
			label="Page and location"
			bind:value={settings.location}
			options={[
				{ value: 'off', label: 'Hide' },
				{ value: 'before', label: 'Before' },
				{ value: 'after', label: 'After' },
			]}
		/>
	</section>

	<Separator />

	<section class="flex flex-col gap-4" aria-label="Highlights and notes">
		{@render group('Highlights and notes')}
		<Choice
			id="note-style"
			label="Notes"
			bind:value={settings.noteStyle}
			options={[
				{ value: 'callout', label: 'Callout' },
				{ value: 'blockquote', label: 'Quote' },
				{ value: 'bold', label: 'Note:' },
			]}
		/>
		<Choice
			id="color"
			label="Highlight color"
			bind:value={settings.color}
			options={[
				{ value: 'off', label: 'Hide' },
				{ value: 'tag', label: '#tag' },
				{ value: 'label', label: 'Label' },
			]}
		/>
		<SwitchRow
			id="heading-tags"
			label="Turn .h1–.h6 notes into headings"
			hint="Readwise-style tags. Off keeps them as regular notes."
			bind:checked={
				() => settings.headingTags === 'headings',
				(on) => (settings.headingTags = on ? 'headings' : 'notes')
			}
		/>
		<SwitchRow
			id="split-headings"
			label="Separate merged headings"
			hint="Kindle joins a heading and the paragraph after it into one highlight. This splits them again."
			disabled={settings.headingTags !== 'headings'}
			bind:checked={settings.splitMergedHeadings}
		/>
	</section>

	<Separator />

	<section class="flex flex-col gap-4" aria-label="Properties">
		{@render group('Properties')}
		<SwitchRow id="frontmatter" label="Add properties (frontmatter)" bind:checked={settings.frontmatter.enabled} />
		{#if settings.frontmatter.enabled}
			<!-- The author link only shows up in the properties, so it's only offered with them. -->
			<SwitchRow id="author-link" label="Author as [[link]]" bind:checked={settings.authorWikilink} />
			<FrontmatterEditor bind:fields={settings.frontmatter.fields} />
		{/if}
	</section>

	<Separator />

	<div>
		<Button variant="ghost" size="sm" class="text-muted-foreground -ml-2" onclick={onreset}>Reset all options</Button>
		<p class="text-muted-foreground mt-1 text-xs">Options are saved in this browser for next time.</p>
	</div>
</div>
