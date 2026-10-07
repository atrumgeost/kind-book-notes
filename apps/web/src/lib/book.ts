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

/** Renames work on a copy, so "Undo" can go back to the parsed book. */
export function renameSection(book: Book, index: number, title: string): Book {
  const sections = book.sections.map((s, i) => (i === index ? { ...s, title: title.trim() || null } : s));
  return { ...book, sections };
}
