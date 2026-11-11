# Kindle Highlights → Markdown

Client-side web app that converts a Kindle "Export Notebook" HTML file into Markdown. See the README for the full picture.

## Hard rules
- 100% client-side: files are parsed in the browser and never uploaded. No backend, ever.
- Readable code over clever code; short comments explain *why*, not *what*.
- Never commit secrets. Never commit anything in `fixtures/private/` (real, copyrighted exports). Committed tests use `fixtures/synthetic/` only.
- Svelte 5 only: runes (`$state`, `$derived`, `$props`, `$effect`) and snippets. No `export let`, no `$:`, no slots.

## Svelte MCP server

The project registers the official Svelte MCP server in `.mcp.json`. Use it whenever you touch Svelte code:

- **`list-sections`**: call this first, at the start of any Svelte task, to see which documentation sections exist (titles, use cases, paths).
- **`get-documentation`**: after `list-sections`, fetch every section relevant to the task (runes, snippets, events, etc.) *before* writing code. Don't rely on memory, because Svelte 5 differs a lot from Svelte 4.
- **`svelte-autofixer`**: run on every `.svelte` file (and `.svelte.ts` module) you create or change, and keep calling it until it reports no issues. Fix suggestions too, unless a suggestion's own condition rules it out (e.g. "ignore if this function doesn't assign state"); then leave a short comment saying why.
- **`playground-link`**: only when the user asks for a shareable playground. Never for code that's already been written to files in this repo.

## Previewing changes

Every push to a non-`main` branch gets a Cloudflare Workers preview build (see `DEPLOY.md`). When the user asks to see or preview a change, push the branch and give them the preview link. Don't start a local dev server or take screenshots unless they ask for that.

The URL looks like `https://<branch-with-slashes-as-dashes>-kind-book-notes.<account>.workers.dev`. For example, `claude/elegant-hopper-0xyg8x` becomes `claude-elegant-hopper-0xyg8x-kind-book-notes.<account>.workers.dev`. If you don't know the account part, ask the user once for a preview link and reuse its pattern.
