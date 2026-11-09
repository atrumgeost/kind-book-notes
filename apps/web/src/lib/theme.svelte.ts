import { MediaQuery, createSubscriber } from 'svelte/reactivity';

// The theme follows the system by default; one button switches to the other theme.
// Switching back to whatever the system shows clears the override, so there's no
// separate "system" option to find. "System" follows, in order:
//   1. a `data-theme` attribute on <html>, which hosts like the Claude Artifact viewer set
//      to pass on their own theme, and
//   2. the operating system's `prefers-color-scheme`.
// The resolved theme is applied as a `.dark` class on <html>, which is what shadcn-svelte styles expect.

export type ThemeChoice = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'kind-book-notes:theme';

class Theme {
  choice: ThemeChoice = $state(readChoice());

  #systemDark = new MediaQuery('prefers-color-scheme: dark');

  // Re-reads `data-theme` whenever a host changes it.
  #subscribeHost = createSubscriber((update) => {
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  });

  get #hostTheme(): 'light' | 'dark' | undefined {
    this.#subscribeHost();
    const value = document.documentElement.dataset.theme;
    return value === 'light' || value === 'dark' ? value : undefined;
  }

  get system(): 'light' | 'dark' {
    return this.#hostTheme ?? (this.#systemDark.current ? 'dark' : 'light');
  }

  get resolved(): 'light' | 'dark' {
    return this.choice === 'system' ? this.system : this.choice;
  }

  /** Switches to the other theme; landing on the system's theme goes back to following the system. */
  toggle() {
    const next = this.resolved === 'dark' ? 'light' : 'dark';
    this.#save(next === this.system ? 'system' : next);
  }

  #save(choice: ThemeChoice) {
    this.choice = choice;
    try {
      localStorage.setItem(STORAGE_KEY, choice);
    } catch {
      // Storage can be blocked; the theme still applies for this visit.
    }
  }
}

function readChoice(): ThemeChoice {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark' || saved === 'system') return saved;
  } catch {
    // Fall through to the default.
  }
  return 'system';
}

export const theme = new Theme();

/** Keeps the `.dark` class on <html> in sync. Call once, from the root component. */
export function applyTheme() {
  // An effect is right here: it only writes to the DOM, never to state.
  $effect(() => {
    const dark = theme.resolved === 'dark';
    document.documentElement.classList.toggle('dark', dark);
    // Makes native controls and scrollbars match too.
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
  });
}
