// The parsed book is plain, JSON-serializable data so callers (the web app,
// a future Obsidian plugin) can cache it, diff it, or edit it before formatting.

export interface Book {
  title: string;
  subtitle?: string;
  /** Display order, e.g. "Austin Kleon" (Kindle writes "Kleon, Austin"). */
  authors: string[];
  year?: number;
  /** The raw APA citation line, kept in case we need more from it later. */
  citation?: string;
  sections: Section[];
}

export interface Section {
  /** null for entries that appear before the first section heading. */
  title: string | null;
  entries: Entry[];
}

export type Entry = Highlight | Note;

export interface Position {
  /** A string because front-matter pages use roman numerals ("xi"). */
  page?: string;
  location?: number;
  /** Chapter from the entry header ("One: Title > Page 12 · …"), when the book provides it. */
  chapter?: string;
}

export interface Highlight extends Position {
  kind: 'highlight';
  /** Empty when the highlight was an image: Kindle exports no text for those. */
  text: string;
  /** Color name from the CSS class (e.g. "yellow"); never the localized label. */
  color: string;
  /** Notes attached to this highlight, in document order. */
  notes: Note[];
  /** Set when a note is a Readwise-style heading tag (".h1"–".h6"). */
  headingLevel?: number;
}

export interface Note extends Position {
  kind: 'note';
  text: string;
}
