import type { Book, Entry, Highlight, Note, Position, Section } from './types';

// Kindle localizes every label ("Highlight", "Nota", "Seite"…), so nothing here
// matches words. We rely on structure only: CSS classes, element order, the
// color span, and the " - ", " > " and " · " separators in entry headers.

const HEADING_TAG = /^\.h([1-6])$/;

/** Parses the HTML of a Kindle "Export Notebook" file. Needs a global DOMParser. */
export function parseKindleExport(html: string): Book {
  const doc = new DOMParser().parseFromString(html, 'text/html');

  const rawTitle = cleanText(doc.querySelector('.bookTitle')?.textContent);
  const authors = parseAuthors(cleanText(doc.querySelector('.authors')?.textContent));
  const citation = cleanText(doc.querySelector('.citation')?.textContent) || undefined;
  const { title, subtitle } = splitTitle(stripAuthorSuffix(rawTitle, authors));

  const book: Book = { title, authors, sections: [] };
  if (subtitle) book.subtitle = subtitle;
  const year = citation?.match(/\((\d{4})\)/)?.[1];
  if (year) book.year = Number(year);
  if (citation) book.citation = citation;

  let section: Section = { title: null, entries: [] };
  book.sections.push(section);
  // Notes attach to the closest highlight before them, but never across a section boundary.
  let lastHighlight: Highlight | null = null;
  let pendingHeader: Element | null = null;

  // querySelectorAll returns elements in document order, which is all we need to walk the file.
  for (const el of doc.querySelectorAll('.sectionHeading, .noteHeading, .noteText')) {
    if (el.classList.contains('sectionHeading')) {
      section = { title: cleanText(el.textContent), entries: [] };
      book.sections.push(section);
      lastHighlight = null;
    } else if (el.classList.contains('noteHeading')) {
      pendingHeader = el;
    } else if (pendingHeader) {
      const entry = buildEntry(pendingHeader, cleanText(el.textContent, true));
      pendingHeader = null;

      if (entry.kind === 'highlight') {
        section.entries.push(entry);
        lastHighlight = entry;
      } else if (lastHighlight && belongsTo(entry, lastHighlight)) {
        lastHighlight.notes.push(entry);
        const tag = entry.text.match(HEADING_TAG);
        if (tag && lastHighlight.headingLevel === undefined) lastHighlight.headingLevel = Number(tag[1]);
      } else {
        // A note with no highlight to attach to is kept on its own, never dropped.
        section.entries.push(entry);
      }
    }
  }

  book.sections = book.sections.filter((s) => s.entries.length > 0);
  return book;
}

function buildEntry(header: Element, text: string): Entry {
  // A color span is the only reliable difference between highlights and notes.
  const colorSpan = header.querySelector('span[class*="annotation_"], span[class*="highlight_"]');
  const position = parsePosition(cleanText(header.textContent));
  if (colorSpan) {
    const color = colorSpan.className.match(/(?:annotation|highlight)_(\w+)/)?.[1] ?? 'yellow';
    return { kind: 'highlight', text, color, notes: [], ...position };
  }
  return { kind: 'note', text, ...position };
}

/** Kindle stores a note's location where the highlight *ends*, so it can be a few numbers past the highlight's. */
function belongsTo(note: Note, highlight: Highlight): boolean {
  if (note.location === undefined || highlight.location === undefined) return true;
  return note.location >= highlight.location;
}

/** Header shapes: "Label - Page 5 · Location 19", "Label - Chapter > Page 5 · Location 19", "Label - Location 19". */
export function parsePosition(header: string): Position {
  const dash = header.indexOf(' - ');
  if (dash === -1) return {};
  const rest = header.slice(dash + 3);

  const position: Position = {};
  const arrow = rest.lastIndexOf(' > ');
  if (arrow !== -1) position.chapter = rest.slice(0, arrow).trim();
  const parts = rest.slice(arrow === -1 ? 0 : arrow + 3).split(' · ');

  // The value is the last word of each part ("Page 5" → "5"). With one part it's
  // the location; with two, page comes first. Exports always include the location.
  const values = parts.map((p) => p.trim().split(' ').pop() ?? '');
  const location = values.pop();
  const page = values.pop();
  if (page) position.page = page;
  if (location) {
    // Strip thousands separators ("1,234" in English, "1.234" in German).
    const n = Number(location.replace(/[^\d]/g, ''));
    if (Number.isFinite(n) && n > 0) position.location = n;
  }
  return position;
}

/** "Kleon, Austin; Doe, Jane" → ["Austin Kleon", "Jane Doe"]. */
export function parseAuthors(raw: string): string[] {
  return raw
    .split(';')
    .map((name) => {
      const parts = name.split(',').map((p) => p.trim());
      // Only flip the simple "Last, First" form; anything else stays as Kindle wrote it.
      return parts.length === 2 && parts[0] && parts[1] ? `${parts[1]} ${parts[0]}` : name.trim();
    })
    .filter(Boolean);
}

/** Some store titles end with "(Author Name)", which is noise in a note title. */
function stripAuthorSuffix(title: string, authors: string[]): string {
  const match = title.match(/^(.*\S)\s*\(([^()]+)\)$/);
  if (match?.[1] && match[2] && authors.some((a) => a.toLowerCase() === match[2]!.trim().toLowerCase())) {
    return match[1];
  }
  return title;
}

/** "Title: Subtitle" → { title, subtitle }. Only splits on the first ": ". */
function splitTitle(full: string): { title: string; subtitle?: string } {
  const i = full.indexOf(': ');
  if (i <= 0) return { title: full };
  return { title: full.slice(0, i).trim(), subtitle: full.slice(i + 2).trim() };
}

/**
 * The export indents everything with newlines and spaces. Collapse that, but
 * optionally keep real line breaks inside highlight and note text.
 */
function cleanText(raw: string | null | undefined, keepLines = false): string {
  if (!raw) return '';
  const lines = raw.split(/\r?\n/).map((l) => l.replace(/\s+/g, ' ').trim()).filter(Boolean);
  return lines.join(keepLines ? '\n' : ' ');
}
