import { describe, expect, it } from 'vitest';
import { DEFAULT_OPTIONS, suggestedFileName, toMarkdown, type FormatOptions } from '../src';
import { loadSynthetic } from './helpers';

const date = '2026-10-07';
// Most tests turn the location line on (it's off by default) so they can check where things land.
const render = (name: string, options: Partial<FormatOptions> = {}) =>
  toMarkdown(loadSynthetic(name), { ...DEFAULT_OPTIONS, location: 'after', date, ...options });

describe('default output', () => {
  // Full-output snapshots: open these files to see exactly what the app produces.
  it.each(['single-level', 'two-level', 'edge-cases'])('%s', async (name) => {
    const md = toMarkdown(loadSynthetic(name), { ...DEFAULT_OPTIONS, date });
    await expect(md).toMatchFileSnapshot(`__snapshots__/${name}.md`);
  });

  it('has no location lines by default', () => {
    const md = toMarkdown(loadSynthetic('single-level'), { ...DEFAULT_OPTIONS, date });
    expect(md).toContain('“Gardening is not a gift. It is a habit of attention.”—Rosa Almeida\n\n---\n\nYou don’t');
    expect(md).not.toContain('*Page 5');
  });

  it('writes the frontmatter from the spec', () => {
    expect(render('single-level')).toMatch(
      /^---\ntitle: "Grow Your Garden!"\nauthor: "Maya Ferreira"\nyear: 2014\nsource: kindle\nhighlights: 13\nnotes: 1\nimported: 2026-10-07\ntags: \[book\]\n---\n\n# Grow Your Garden!\n\n## A New Kind of Soil\n\n/,
    );
  });

  it('separates highlights with a rule but never next to a heading', () => {
    const md = render('single-level');
    expect(md).toContain('*Page 5 · Location 19*\n\n---\n\nYou don’t');
    expect(md).toContain('*Page 6 · Location 37*\n\n## 1. You Don’t');
  });

  it('shows image highlights as a placeholder, with their location', () => {
    expect(render('single-level')).toContain(
      '## 2. Think Roots, Not Flowers.\n\n*🖼 Image highlight, not included in the Kindle export.*\n*Page 22 · Location 149*',
    );
    expect(render('single-level', { location: 'off' })).toContain(
      '*🖼 Image highlight, not included in the Kindle export (Page 22 · Location 149).*',
    );
  });

  it('attaches notes as callouts right after their highlight', () => {
    expect(render('single-level')).toContain(
      '*Page 56 · Location 398*\n\n> [!note]\n> makes me think about labeling the balcony herbs\n\n---',
    );
  });

  it('keeps multi-line notes inside the quote', () => {
    expect(render('edge-cases')).toContain('> [!note]\n> second note\n> with two lines');
  });

  it('escapes only Markdown that would change the structure', () => {
    expect(render('edge-cases')).toContain('Special characters: *stars*, _underscores_, [brackets], # hash, <tag> & ampersand.');
  });
});

describe('heading tags', () => {
  it('turns tagged highlights into headings: .h1 at the chapter level, .h2 one below', () => {
    const md = render('two-level', { titleHeading: 'none' });
    expect(md).toContain('### Two: What Is Worth Planting?\n\n#### Values and Seasons\n');
    expect(md).not.toMatch(/\.h[1-6]/);
  });

  it('keeps a tagged long sentence as a normal highlight', () => {
    const md = render('single-level');
    expect(md).toContain('the planner and the improviser—has something to offer.\n*Page 12 · Location 68*');
    expect(md).not.toMatch(/^#+ In a shared plot/m);
    expect(md).not.toMatch(/\.h[1-6]/);
  });

  it('nests below sub-chapters taken from entry headers', () => {
    const md = render('two-level');
    expect(md).toContain('## Part I: Planting\n\n### One: Seed by Seed\n\nSeed by seed');
    expect(md).toContain('\n#### The Approach\n');
    expect(md).toContain('\n##### Tools to Overcome It\n');
  });

  it('skips a tagged heading that repeats the chapter or section title', () => {
    const md = render('two-level');
    expect(md).not.toContain('#### Introduction');
    expect(md).not.toContain('One Seed by Seed');
    expect(md).not.toContain('#### Two What Is Worth Planting?');
  });

  it('splits merged headings, keeping the location on each part', () => {
    expect(render('two-level')).toContain(
      '#### Change Is Slow\n\nWhy is it so hard to grow anything quickly? One answer lives in the soil itself.\n*Page 14 · Location 594*',
    );
  });

  it('without splitting, a merged heading stays one piece (a paragraph when it reads like prose)', () => {
    const md = render('two-level', { splitMergedHeadings: false });
    expect(md).toContain('\nChange Is Slow Why is it so hard to grow anything quickly? One answer lives in the soil itself.\n');
    expect(md).toContain('\n#### Borrowed Wishes: the Seeds Come from outside the Fence\n');
  });

  it('can keep the tags as notes instead', () => {
    const md = render('two-level', { headingTags: 'notes' });
    expect(md).toContain('*Page 13 · Location 580*\n\n> [!note]\n> .h2');
    expect(md).toMatch(/notes: 13\n/);
  });
});

describe('options', () => {
  it('title heading: h2 or none', () => {
    expect(render('single-level', { titleHeading: 'h2', frontmatter: { enabled: false, fields: [] } })).toMatch(
      /^## Grow Your Garden!\n\n## A New Kind/,
    );
    expect(render('single-level', { titleHeading: 'none', frontmatter: { enabled: false, fields: [] } })).toMatch(
      /^## A New Kind/,
    );
  });

  it('chapter heading level', () => {
    const md = render('two-level', { chapterLevel: 1 });
    expect(md).toContain('\n# Part I: Planting\n\n## One: Seed by Seed\n');
  });

  it('separator: blank line or location line only', () => {
    expect(render('single-level', { separator: 'blank' })).toContain('*Page 5 · Location 19*\n\nYou don’t');
    expect(render('single-level', { separator: 'location', location: 'off' })).toContain(
      '*Page 5 · Location 19*\n\nYou don’t',
    );
  });

  it('location line before the highlight, or off', () => {
    expect(render('single-level', { location: 'before' })).toContain(
      '*Page 5 · Location 24*\nYou don’t really find your harvest; it finds you.',
    );
    expect(render('single-level', { location: 'off' })).not.toContain('Location 24');
  });

  it('note styles', () => {
    const note = 'makes me think about labeling the balcony herbs';
    expect(render('single-level', { noteStyle: 'blockquote' })).toContain(`*Page 56 · Location 398*\n\n> ${note}`);
    expect(render('single-level', { noteStyle: 'bold' })).toContain(`**Note:** ${note}`);
  });

  it('highlight color as tag or label', () => {
    expect(render('edge-cases', { color: 'tag' })).toContain('*Location 10* #blue');
    expect(render('edge-cases', { color: 'label' })).toContain('*Location 10 · Blue*');
    expect(render('edge-cases', { color: 'label', location: 'off' })).toContain('two.\n*Blue*');
  });

  it('author as wikilink, and several authors as a list', () => {
    expect(render('single-level', { authorWikilink: true })).toContain('author: "[[Maya Ferreira]]"');
    expect(render('edge-cases', { authorWikilink: true })).toContain('author: ["[[Jane Doe]]", "[[Richard Roe]]"]');
  });

  it('custom frontmatter fields', () => {
    const md = render('edge-cases', {
      frontmatter: {
        enabled: true,
        fields: [
          { key: 'rating', value: '' },
          { key: 'year', value: '{{year}}' },
          { key: 'aliases', value: '["{{fullTitle}}"]' },
          { key: '', value: 'ignored' },
        ],
      },
    });
    // Blank stays (to fill in later), a missing variable drops the field, mixed text is written as typed.
    expect(md).toMatch(/^---\nrating:\naliases: \["“Quotes” & <Angles>: Café \/ Notes\? #1"\]\n---\n/);
  });

  it('frontmatter off', () => {
    expect(render('single-level', { frontmatter: { enabled: false, fields: DEFAULT_OPTIONS.frontmatter.fields } })).toMatch(
      /^# Grow Your Garden!/,
    );
  });
});

describe('suggestedFileName', () => {
  it('removes characters that break file systems or Obsidian links', () => {
    expect(suggestedFileName(loadSynthetic('edge-cases'))).toBe('“Quotes” & Angles.md');
    expect(suggestedFileName(loadSynthetic('single-level'))).toBe('Grow Your Garden!.md');
  });
});
