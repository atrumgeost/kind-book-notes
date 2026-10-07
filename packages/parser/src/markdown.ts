import { looksLikeHeading, splitMergedHeading } from './headings';
import type { Book, Highlight, Note, Position, Section } from './types';

export interface FrontmatterField {
  key: string;
  /** Literal text, or variables like "{{title}}". See `bookVariables` for the list. */
  value: string;
}

export interface FormatOptions {
  titleHeading: 'h1' | 'h2' | 'none';
  /** Level for section headings (1–4). Sub-chapters and tagged headings go below it. */
  chapterLevel: 1 | 2 | 3 | 4;
  separator: 'rule' | 'blank' | 'location';
  location: 'after' | 'before' | 'off';
  noteStyle: 'callout' | 'blockquote' | 'bold';
  color: 'off' | 'tag' | 'label';
  authorWikilink: boolean;
  frontmatter: { enabled: boolean; fields: FrontmatterField[] };
  /** What to do with ".h1"–".h6" notes: turn the highlight into a heading, or keep them as notes. */
  headingTags: 'headings' | 'notes';
  /** Try to separate a heading Kindle merged with the paragraph next to it. */
  splitMergedHeadings: boolean;
  /** "YYYY-MM-DD" for {{date}}. Defaults to today; pass it to get stable output. */
  date?: string;
}

export const DEFAULT_FRONTMATTER: FrontmatterField[] = [
  { key: 'title', value: '{{title}}' },
  { key: 'author', value: '{{author}}' },
  { key: 'year', value: '{{year}}' },
  { key: 'source', value: 'kindle' },
  { key: 'highlights', value: '{{highlights}}' },
  { key: 'notes', value: '{{notes}}' },
  { key: 'imported', value: '{{date}}' },
  { key: 'tags', value: '[book]' },
];

export const DEFAULT_OPTIONS: FormatOptions = {
  titleHeading: 'h1',
  chapterLevel: 2,
  separator: 'rule',
  location: 'off',
  noteStyle: 'callout',
  color: 'off',
  authorWikilink: false,
  frontmatter: { enabled: true, fields: DEFAULT_FRONTMATTER },
  headingTags: 'headings',
  splitMergedHeadings: true,
};

const HEADING_TAG = /^\.h([1-6])$/;

type Value = string | number | string[] | undefined;

/** The variables available to frontmatter fields (and, later, to templates). */
export function bookVariables(book: Book, options: FormatOptions): Record<string, Value> {
  const authors = book.authors.map((a) => (options.authorWikilink ? `[[${a}]]` : a));
  const highlights = book.sections.flatMap((s) => s.entries).filter((e) => e.kind === 'highlight');
  const notes = book.sections
    .flatMap((s) => s.entries)
    .flatMap((e) => (e.kind === 'note' ? [e] : e.notes))
    .filter((n) => options.headingTags === 'notes' || !HEADING_TAG.test(n.text));
  return {
    title: book.title,
    subtitle: book.subtitle,
    fullTitle: book.subtitle ? `${book.title}: ${book.subtitle}` : book.title,
    author: authors.length > 1 ? authors : authors[0],
    year: book.year,
    highlights: highlights.length,
    notes: notes.length,
    date: options.date ?? new Date().toISOString().slice(0, 10),
  };
}

export function toMarkdown(book: Book, options: FormatOptions = DEFAULT_OPTIONS): string {
  const parts: string[] = [];
  if (options.frontmatter.enabled) parts.push(renderFrontmatter(book, options));
  parts.push(renderBody(book, options));
  return parts.filter(Boolean).join('\n\n') + '\n';
}

export function renderFrontmatter(book: Book, options: FormatOptions): string {
  const vars = bookVariables(book, options);
  const lines: string[] = [];
  for (const { key, value } of options.frontmatter.fields) {
    if (!key.trim()) continue;
    const rendered = renderYamlValue(value, vars);
    // A field built only from a missing variable (e.g. no year) is left out; a field the user left blank stays.
    if (rendered === null) continue;
    lines.push(rendered === '' ? `${key}:` : `${key}: ${rendered}`);
  }
  return ['---', ...lines, '---'].join('\n');
}

function renderYamlValue(template: string, vars: Record<string, Value>): string | null {
  const single = template.trim().match(/^\{\{\s*(\w+)\s*\}\}$/);
  if (single) {
    const value = vars[single[1]!];
    if (value === undefined || value === '') return null;
    if (typeof value === 'number') return String(value);
    // Leave dates unquoted so YAML (and Obsidian's Properties) read them as dates.
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    if (Array.isArray(value)) return `[${value.map(yamlString).join(', ')}]`;
    return yamlString(value);
  }
  // Mixed text is written as typed: the user owns its YAML syntax.
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, name: string) => {
    const value = vars[name];
    return Array.isArray(value) ? value.join(', ') : String(value ?? '');
  }).trim();
}

// JSON strings are valid YAML double-quoted strings, which handles quotes, colons and "[[links]]".
const yamlString = (s: string) => JSON.stringify(s);

// ---------------------------------------------------------------------------
// Body

type Block = { kind: 'heading'; text: string } | { kind: 'entry'; text: string };

export function renderBody(book: Book, options: FormatOptions): string {
  const blocks: Block[] = [];
  if (options.titleHeading !== 'none') {
    blocks.push({ kind: 'heading', text: heading(options.titleHeading === 'h1' ? 1 : 2, book.title) });
  }

  // Books that put chapters inside entry headers get one extra heading level for them.
  const hasChapters = book.sections.some((s) => s.entries.some((e) => e.chapter));
  const chapterLevel = options.chapterLevel + (hasChapters ? 1 : 0);

  for (const section of book.sections) {
    blocks.push(...renderSection(section, options, chapterLevel));
  }
  return joinBlocks(blocks, options);
}

function renderSection(section: Section, options: FormatOptions, chapterLevel: number): Block[] {
  const blocks: Block[] = [];
  // Entries before the first section heading get no heading at all.
  if (section.title !== null) blocks.push({ kind: 'heading', text: heading(options.chapterLevel, section.title) });

  let chapter: string | undefined;
  for (const entry of section.entries) {
    if (entry.chapter && entry.chapter !== chapter) {
      chapter = entry.chapter;
      blocks.push({ kind: 'heading', text: heading(chapterLevel, chapter) });
    }
    if (entry.kind === 'highlight') {
      const parents = [section.title, chapter].filter((t): t is string => !!t);
      blocks.push(...renderHighlight(entry, options, chapterLevel, parents));
    }
    else if (options.headingTags === 'notes' || !HEADING_TAG.test(entry.text)) {
      blocks.push({ kind: 'entry', text: renderStandaloneNote(entry, options) });
    }
  }
  return blocks;
}

function renderHighlight(h: Highlight, options: FormatOptions, chapterLevel: number, parents: string[]): Block[] {
  const asHeading = options.headingTags === 'headings' && h.headingLevel !== undefined;
  const notes = asHeading ? h.notes.filter((n) => !HEADING_TAG.test(n.text)) : h.notes;

  // Image highlights have no text to turn into a heading, so they render as normal entries.
  if (!asHeading || !h.text) return [{ kind: 'entry', text: renderEntry(h, notes, options) }];

  const split = (options.splitMergedHeadings && splitMergedHeading(h.text)) || { heading: h.text };
  if (!looksLikeHeading(split.heading)) return [{ kind: 'entry', text: renderEntry(h, notes, options) }];
  const blocks: Block[] = [];
  if (split.before) blocks.push({ kind: 'entry', text: renderEntry({ ...h, text: split.before }, [], options) });
  // People often tag the chapter title itself, which the export already gives us as a heading.
  if (!parents.some((p) => sameTitle(p, split.heading))) {
    // ".h1" marks a chapter title in practice, so it shares the chapter's level and ".h2" goes one below.
    blocks.push({ kind: 'heading', text: heading(chapterLevel + h.headingLevel! - 1, split.heading) });
  }
  if (split.after) blocks.push({ kind: 'entry', text: renderEntry({ ...h, text: split.after }, notes, options) });
  else if (notes.length) blocks.push({ kind: 'entry', text: renderNotes(notes, options) });
  return blocks;
}

/** "One: Little by Little" and "One Little by Little" are the same title. */
function sameTitle(a: string, b: string): boolean {
  const norm = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
  return norm(a) === norm(b);
}

function renderEntry(h: Highlight, notes: Note[], options: FormatOptions): string {
  const meta = metaLine(h, options);
  const text = h.text ? escapeBlock(h.text) : imagePlaceholder(h, meta);
  const main = !meta ? text : options.location === 'before' ? `${meta}\n${text}` : `${text}\n${meta}`;
  return notes.length ? `${main}\n\n${renderNotes(notes, options)}` : main;
}

/** Kindle exports image highlights without the image; say so, and say where to find it. */
function imagePlaceholder(h: Highlight, meta: string): string {
  const where = meta ? '' : ` (${positionLabel(h) || 'no location'})`;
  return `*🖼 Image highlight, not included in the Kindle export${where}.*`;
}

function renderStandaloneNote(note: Note, options: FormatOptions): string {
  const meta = metaLine(note, options);
  return meta ? `${meta}\n\n${renderNote(note, options)}` : renderNote(note, options);
}

function renderNotes(notes: Note[], options: FormatOptions): string {
  return notes.map((n) => renderNote(n, options)).join('\n\n');
}

function renderNote(note: Note, options: FormatOptions): string {
  const lines = note.text.split('\n');
  switch (options.noteStyle) {
    case 'callout':
      return ['> [!note]', ...lines.map((l) => `> ${l}`)].join('\n');
    case 'blockquote':
      return lines.map((l) => `> ${l}`).join('\n');
    case 'bold':
      return `**Note:** ${lines.join('\n')}`;
  }
}

/** "*Page 5 · Location 19*", plus the color as a tag or label when enabled. */
function metaLine(entry: Highlight | Note, options: FormatOptions): string {
  const showPosition = options.location !== 'off' || options.separator === 'location';
  const position = showPosition ? positionLabel(entry) : '';
  const color = entry.kind === 'highlight' ? entry.color : undefined;

  if (color && options.color === 'label') {
    const label = color[0]!.toUpperCase() + color.slice(1);
    return `*${position ? `${position} · ${label}` : label}*`;
  }
  const tag = color && options.color === 'tag' ? `#${color}` : '';
  return [position && `*${position}*`, tag].filter(Boolean).join(' ');
}

function positionLabel(p: Position): string {
  return [p.page && `Page ${p.page}`, p.location !== undefined && `Location ${p.location}`]
    .filter(Boolean)
    .join(' · ');
}

function joinBlocks(blocks: Block[], options: FormatOptions): string {
  let out = '';
  blocks.forEach((block, i) => {
    const prev = blocks[i - 1];
    if (prev) {
      // Separators only go between two highlights, never next to a heading.
      out += prev.kind === 'entry' && block.kind === 'entry' && options.separator === 'rule' ? '\n\n---\n\n' : '\n\n';
    }
    out += block.text;
  });
  return out;
}

function heading(level: number, text: string): string {
  return `${'#'.repeat(Math.min(6, Math.max(1, level)))} ${text}`;
}

/**
 * Kindle text is plain prose. Only escape what would change the Markdown
 * structure at the start of a line (headings, quotes, lists, rules); inline
 * characters stay readable in the source.
 */
function escapeBlock(text: string): string {
  return text
    .split('\n')
    .map((line) =>
      line
        .replace(/^(#{1,6}\s|>|[-+*]\s|[-*_]{3,}\s*$)/, '\\$1')
        .replace(/^(\d+)([.)]\s)/, '$1\\$2'),
    )
    .join('\n');
}

/** A safe file name from the book title: no characters that break Obsidian or file systems. */
export function suggestedFileName(book: Book): string {
  const name = book.title
    .replace(/[\\/:*?"<>|#^[\]]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[. ]+$/, '');
  return `${name || 'Kindle highlights'}.md`;
}
