// Applies the saved theme before the app loads, so dark mode doesn't flash white first.
// Mirrors src/lib/theme.svelte.ts. Kept as a file (not inline) so the Content-Security-Policy
// can forbid inline scripts.
try {
  const root = document.documentElement;
  const choice = localStorage.getItem('kind-book-notes:theme') || 'system';
  const system = root.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  root.classList.toggle('dark', (choice === 'system' ? system : choice) === 'dark');
} catch {}
