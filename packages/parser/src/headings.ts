// When you highlight a heading and the paragraph next to it, Kindle merges both
// into one highlight. With a ".hN" tag on it, the whole paragraph would become a
// giant heading. These helpers try to find where the heading starts and ends.
//
// The rule of thumb: English headings are Title Case and sentences are not. We
// only split when the result looks clearly right; otherwise the text is left alone.

export interface HeadingSplit {
  /** Text highlighted before the heading (the end of the previous paragraph). */
  before?: string;
  heading: string;
  /** Text highlighted after the heading (the start of the next paragraph). */
  after?: string;
}

// Short words that stay lowercase inside a Title Case heading.
const MINOR_WORDS = new Set([
  'a', 'an', 'the', 'and', 'but', 'or', 'nor', 'for', 'so', 'yet',
  'about', 'as', 'at', 'by', 'from', 'in', 'into', 'of', 'off', 'on', 'onto',
  'over', 'per', 'to', 'up', 'via', 'vs', 'versus', 'with',
]);

const SENTENCE_END = /[.!?…]["”’)]*$/;
// A sentence boundary: end punctuation (plus closing quotes), then a space.
const BOUNDARY = /[.!?…]["”’)]*\s+/g;

const core = (word: string) => word.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');
const isCapitalized = (word: string) => /^[\p{Lu}\p{N}]/u.test(core(word));

function isTitleWord(word: string): boolean {
  const c = core(word);
  if (!c) return true; // pure punctuation, like "." or "—"
  return isCapitalized(word) || MINOR_WORDS.has(c);
}

/** Returns null when the text should stay as one heading (it already is one, or no confident split). */
export function splitMergedHeading(text: string): HeadingSplit | null {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0 || words.every(isTitleWord)) return null;
  const first = headingFirst(words);
  const last = headingLast(text);
  // Both ends can look like a heading: "Five Be a Friend to Yourself The curious… —Carl R. Rogers, On Becoming
  // A Person" vs "Henry Ford said… Tools to Overcome It". The longer Title Case run is the real heading.
  if (first && last) return wordCount(first.heading) >= wordCount(last.heading) ? first : last;
  return first ?? last ?? headingMiddle(text);
}

const wordCount = (s: string) => s.split(/\s+/).length;

/**
 * A tag on a long, complete sentence usually marks a heading that wasn't
 * highlightable (some books draw headings as images), not the sentence itself.
 */
export function looksLikeHeading(text: string): boolean {
  return wordCount(text) <= 12 || !SENTENCE_END.test(text.trim());
}

// "…you're right." Tools to Overcome It → the heading trails the paragraph.
function headingLast(text: string): HeadingSplit | null {
  if (SENTENCE_END.test(text)) return null;
  // Colons count here too: "…one of these three biases: Confirmation Bias".
  const match = text.match(/^(.*[.!?…:]["”’)]*)\s+([^.!?…:]+)$/s);
  if (!match?.[1] || !match[2]) return null;
  const tail = match[2].trim().split(/\s+/);
  if (!tail.every(isTitleWord) || !isCapitalized(tail[0]!)) return null;
  return { before: match[1].trim(), heading: match[2].trim() };
}

// "Values and Desires You might be thinking…" → the heading leads the paragraph.
function headingFirst(words: string[], minHeadingWords = 1): HeadingSplit | null {
  let end = 0;
  while (end < words.length && isTitleWord(words[end]!)) end++;
  // The paragraph's first word is capitalized too, so it hides at the end of the Title Case run.
  let split = end - 1;
  while (split > 0 && !isCapitalized(words[split]!)) split--;
  // Drop lowercase connector words left dangling at the end of the heading ("…Little by").
  let headingEnd = split;
  while (headingEnd > 0 && !isCapitalized(words[headingEnd - 1]!)) headingEnd--;
  if (headingEnd < minHeadingWords) return null;

  const after = words.slice(split);
  if (!looksLikeProse(after)) return null;
  return { heading: words.slice(0, headingEnd).join(' '), after: after.join(' ') };
}

// "…plan ahead. Fatigue Fallout: When There's Nothing in the Tank We've already…"
// → a whole heading sits between two paragraphs.
function headingMiddle(text: string): HeadingSplit | null {
  for (const match of text.matchAll(BOUNDARY)) {
    const cut = match.index + match[0].length;
    // Two-word minimum: a lone capitalized word after a period is usually just a sentence start.
    const split = headingFirst(text.slice(cut).split(/\s+/).filter(Boolean), 2);
    if (split) return { before: text.slice(0, cut).trim(), ...split };
  }
  return null;
}

/**
 * Prose ends like a sentence, or at least has plenty of lowercase words.
 * This stops us from cutting a long heading in half ("…the Call Is | Coming from outside the House").
 */
function looksLikeProse(words: string[]): boolean {
  if (SENTENCE_END.test(words.join(' '))) return true;
  const lowercase = words.filter((w) => !isTitleWord(w)).length;
  return lowercase >= 3 && lowercase / words.length >= 0.4;
}
