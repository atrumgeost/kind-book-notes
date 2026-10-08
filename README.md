# Kind Book Notes

Turn your Kindle highlights and notes into clean Markdown for Obsidian or any notes app.

**Live:** https://books.katanalab.dev

Drop a Kindle "Export Notebook" file on the page and get Markdown back:

- Book details as YAML frontmatter (properties), with fields you choose.
- Highlights grouped by chapter, as plain paragraphs.
- Your notes attached to the highlight they belong to, as callouts or quotes.
- Optional: Readwise-style `.h1`–`.h6` notes turned into headings, including headings Kindle merged into the next paragraph.
- Copy to the clipboard or download a `.md` file.

## Privacy

Your files never leave your browser. The page reads the export on your device and converts it there. There is no server-side code, no database, no accounts and no analytics. The server's Content Security Policy blocks the page from making network requests at all, so this isn't only a promise: the browser enforces it.

## How to export your notebook from Kindle

1. Open the book in the Kindle app (iPhone, iPad or Android).
2. Open the **Notebook** (the notes icon at the top of the reading screen).
3. Tap the **share/export** icon and choose **Export Notebook**.
4. Pick a citation style (**APA** gives the publication year) and send the file to yourself, for example by email or to Files.
5. Drop the `.html` file on Kind Book Notes.

## Project layout

```
packages/parser   Pure TypeScript, no runtime dependencies. parseKindleExport() → Book, toMarkdown(Book, options) → string.
                  Runs anywhere with a DOMParser: browsers, and later an Obsidian plugin.
apps/web          The web app: Vite, Svelte 5, Tailwind CSS v4, shadcn-svelte.
fixtures/synthetic  Invented books with the exact structure of real exports. Tests use these.
fixtures/private    Your real exports, for local testing only. Ignored by git; never commit them (copyrighted text).
deploy/Caddyfile  Web server config for the Docker image.
```

## Local development

You need Node.js 22 and pnpm (`corepack enable` installs the right pnpm version).

```sh
pnpm install
pnpm --filter @kind-book-notes/web dev     # app at http://localhost:5173
pnpm test                                  # parser tests
pnpm --filter @kind-book-notes/web check   # type-check the app
```

To test against your own books, put Kindle exports in `fixtures/private/`. The tests pick them up automatically.

To host your own copy, see [DEPLOY.md](DEPLOY.md): it covers Coolify and any other Docker host.

## Maintenance

Kind Book Notes is maintained in my spare time. There are no promises about response times for issues. Pull requests are welcome, but there's no guarantee they'll be merged.

## License

[AGPL-3.0](LICENSE) for the whole repository, including the parser. If you run a modified version as a public service, you must share your changes under the same license.
