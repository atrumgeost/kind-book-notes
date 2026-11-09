import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseKindleExport } from '../src';

const fixtures = resolve(import.meta.dirname, '../../../fixtures') + '/';

export const loadSynthetic = (name: string) => parseKindleExport(readFileSync(`${fixtures}synthetic/${name}.html`, 'utf8'));

/** Real exports live only on the maintainer's machine (gitignored), so these tests are optional. */
export function privateFixtures(): { name: string; html: string }[] {
  const dir = `${fixtures}private/`;
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith('.html'))
    .map((name) => ({ name, html: readFileSync(dir + name, 'utf8') }));
}
