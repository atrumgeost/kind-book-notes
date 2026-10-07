import { parseKindleExport, type Book } from '@kind-book-notes/parser';

/** Parses a dropped file. Throws a message people can act on when it isn't a Kindle export. */
export function readKindleExport(html: string): Book {
  const book = parseKindleExport(html);
  if (!book.title && book.sections.length === 0) {
    throw new Error(
      'This file doesn’t look like a Kindle notebook export. In the Kindle app, open a book’s Notebook, choose Export, and pick the HTML file it creates.',
    );
  }
  if (book.sections.length === 0) {
    throw new Error('This export has no highlights or notes in it.');
  }
  return book;
}

/** Section edits (rename, merge) work on a copy, so "Undo edits" can go back to the parsed book. */
export function renameSection(book: Book, index: number, title: string): Book {
  const sections = book.sections.map((s, i) => (i === index ? { ...s, title: title.trim() || null } : s));
  return { ...book, sections };
}

/** Moves the entries of the next section into this one and drops the next section's heading. */
export function mergeWithNext(book: Book, index: number): Book {
  const current = book.sections[index];
  const next = book.sections[index + 1];
  if (!current || !next) return book;
  const merged = { ...current, entries: [...current.entries, ...next.entries] };
  return { ...book, sections: book.sections.toSpliced(index, 2, merged) };
}
