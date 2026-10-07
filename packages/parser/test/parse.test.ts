import { describe, expect, it } from 'vitest';
import { parseAuthors, parsePosition, type Highlight, type Note } from '../src';
import { loadSynthetic } from './helpers';

describe('single-level export', () => {
  const book = loadSynthetic('single-level');

  it('reads metadata, dropping the author suffix and splitting the subtitle', () => {
    expect(book.title).toBe('Grow Your Garden!');
    expect(book.subtitle).toBe('10 Ways to Plant Ideas and Watch Them Bloom');
    expect(book.authors).toEqual(['Maya Ferreira']);
    expect(book.year).toBe(2014);
  });

  it('groups entries by section and omits empty sections', () => {
    expect(book.sections.map((s) => s.title)).toEqual([
      'A New Kind of Soil',
      '1. You Don’t Have to Be an Expert.',
      '2. Think Roots, Not Flowers.',
      '3. Share One Seed Every Day.',
      '5. Don’t Turn Into a Weed.',
    ]);
  });

  it('keeps page, location and color on highlights', () => {
    expect(book.sections[0]!.entries[0]).toMatchObject({
      kind: 'highlight',
      color: 'yellow',
      page: '5',
      location: 19,
      notes: [],
    });
  });

  it('keeps a note with no highlight before it as a standalone note', () => {
    expect(book.sections[1]!.entries[0]).toMatchObject({ kind: 'note', text: '.h1', location: 44 });
  });

  it('attaches a note to the previous highlight even when its location is later', () => {
    const h = book.sections[1]!.entries[3] as Highlight;
    expect(h.location).toBe(68);
    expect(h.notes).toMatchObject([{ text: '.h2', location: 70 }]);
    expect(h.headingLevel).toBe(2);
  });

  it('keeps image highlights (empty text) and their notes', () => {
    expect(book.sections[2]!.entries[0]).toMatchObject({ kind: 'highlight', text: '', headingLevel: 1 });
  });

  it('attaches a plain note without setting a heading level', () => {
    const h = book.sections[3]!.entries[0] as Highlight;
    expect(h.notes[0]!.text).toBe('makes me think about labeling the balcony herbs');
    expect(h.headingLevel).toBeUndefined();
  });
});

describe('two-level export', () => {
  const book = loadSynthetic('two-level');

  it('reads the chapter from entry headers and keeps roman page numbers', () => {
    expect(book.sections[0]!.entries[0]).toMatchObject({ page: 'xi', location: 120 });
    expect(book.sections[0]!.entries[0]!.chapter).toBeUndefined();
    expect(book.sections[1]!.entries[0]).toMatchObject({ chapter: 'One: Seed by Seed', page: '12', location: 548 });
  });

  it('keeps chapter names that contain commas', () => {
    expect(book.sections[2]!.entries[0]!.chapter).toBe('Three: Roots, Rain, and Rest');
  });

  it('attaches several notes in a row to the same highlight; the first heading tag wins', () => {
    const h = book.sections[2]!.entries.find((e) => e.location === 2467) as Highlight;
    expect(h.notes.map((n) => n.text)).toEqual(['.h2', '.h3']);
    expect(h.headingLevel).toBe(2);
  });

  it('drops the empty trailing "Notes" section', () => {
    expect(book.sections.map((s) => s.title)).not.toContain('Notes');
  });
});

describe('edge cases', () => {
  const book = loadSynthetic('edge-cases');
  const entries = book.sections[0]!.entries;

  it('decodes HTML entities in the title and reads several authors', () => {
    expect(book.title).toBe('“Quotes” & <Angles>');
    expect(book.subtitle).toBe('Café / Notes? #1');
    expect(book.authors).toEqual(['Jane Doe', 'Richard Roe']);
    expect(book.year).toBeUndefined();
  });

  it('puts everything in one untitled section when there are no section headings', () => {
    expect(book.sections).toHaveLength(1);
    expect(book.sections[0]!.title).toBeNull();
  });

  it('keeps a note that comes before any highlight', () => {
    expect(entries[0]).toMatchObject({ kind: 'note', text: 'a note written before any highlight' });
  });

  it('keeps line breaks inside highlights and notes', () => {
    const h = entries[1] as Highlight;
    expect(h.text).toBe('Line one of a highlight\nthat continues on line two.');
    expect(h.notes.map((n: Note) => n.text)).toEqual(['first note on the blue highlight', 'second note\nwith two lines']);
  });

  it('reads colors from the CSS class and locations with thousands separators', () => {
    expect(entries.slice(1).map((e) => (e as Highlight).color)).toEqual(['blue', 'pink', 'orange']);
    expect(entries[2]).toMatchObject({ location: 1234 });
    expect(entries[2]!.page).toBeUndefined();
    expect(entries[3]).toMatchObject({ page: '7', location: 1240 });
  });
});

describe('parsePosition', () => {
  // Labels are deliberately in other languages: parsing must depend only on structure.
  it.each([
    ['Nota - Página 5 · Posición 19', { page: '5', location: 19 }],
    ['Markierung (gelb) - Seite xii · Position 1.234', { page: 'xii', location: 1234 }],
    ['Destaque (amarelo) - Capítulo 1 > Página 9 · Posição 45', { chapter: 'Capítulo 1', page: '9', location: 45 }],
    ['Highlight(yellow) - Location 88', { location: 88 }],
    ['Highlight(yellow) - A > B > Page 1 · Location 2', { chapter: 'A > B', page: '1', location: 2 }],
    ['No separator at all', {}],
  ])('%s', (header, expected) => {
    expect(parsePosition(header)).toEqual(expected);
  });
});

describe('parseAuthors', () => {
  it('flips "Last, First" but leaves other shapes alone', () => {
    expect(parseAuthors('Kleon, Austin')).toEqual(['Austin Kleon']);
    expect(parseAuthors('Plato')).toEqual(['Plato']);
    expect(parseAuthors('King, Martin Luther, Jr.')).toEqual(['King, Martin Luther, Jr.']);
    expect(parseAuthors('')).toEqual([]);
  });
});
