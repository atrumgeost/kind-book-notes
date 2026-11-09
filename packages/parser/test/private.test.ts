// Sanity checks against real Kindle exports in fixtures/private/. That folder is
// gitignored (copyrighted text), so these tests only run on a machine that has it.
import { describe, expect, it } from 'vitest';
import { DEFAULT_OPTIONS, parseKindleExport, toMarkdown } from '../src';
import { privateFixtures } from './helpers';

const fixtures = privateFixtures();

describe.skipIf(fixtures.length === 0)('private fixtures', () => {
  it.each(fixtures)('$name', ({ html }) => {
    const book = parseKindleExport(html);
    const entries = book.sections.flatMap((s) => s.entries);
    const highlights = entries.filter((e) => e.kind === 'highlight');
    const notes = entries.flatMap((e) => (e.kind === 'note' ? [e] : e.notes));

    expect(book.title).not.toBe('');
    expect(book.authors.length).toBeGreaterThan(0);
    // Nothing is lost: every entry in the file ends up somewhere.
    expect(highlights).toHaveLength(html.match(/class="annotation_/g)!.length);
    expect(highlights.length + notes.length).toBe(html.match(/class="noteHeading"/g)!.length);

    const md = toMarkdown(book, DEFAULT_OPTIONS);
    // Merged-heading splitting should never leave a paragraph-sized heading behind.
    const longHeadings = md.split('\n').filter((l) => /^#{1,6} /.test(l) && l.split(' ').length > 25);
    expect(longHeadings).toEqual([]);
  });
});
