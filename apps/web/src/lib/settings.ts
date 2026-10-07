import { DEFAULT_OPTIONS, type FormatOptions } from '@kind-book-notes/parser';

// Format options live in localStorage so people set them up once.
// Storage can be missing or throw (private windows, blocked site data), so
// every access is wrapped and the app falls back to defaults.

const STORAGE_KEY = 'kind-book-notes:format-options:v1';

export type Settings = Omit<FormatOptions, 'date'>;

export function defaultSettings(): Settings {
  return structuredClone({ ...DEFAULT_OPTIONS, date: undefined });
}

export function loadSettings(): Settings {
  const defaults = defaultSettings();
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    // Merge over defaults so options added in later versions still get a value.
    return saved ? { ...defaults, ...saved, frontmatter: { ...defaults.frontmatter, ...saved.frontmatter } } : defaults;
  } catch {
    return defaults;
  }
}

export function saveSettings(settings: Settings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Not being able to save is fine: the options still work for this visit.
  }
}
