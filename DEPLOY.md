# Deploying

Kind Book Notes is a static site: a build produces a handful of files in `apps/web/dist`, and every conversion happens in the visitor's browser. There's no server-side code to run.

It's hosted on **Cloudflare Workers** as static files: free, served from Cloudflare's global network, no server to maintain, and deployed on every push to `main`. The security headers include a Content Security Policy that blocks the page from making network requests, so the privacy promise is enforced by the browser. The domain isn't in the code anywhere: you set it in Cloudflare.

Because the build output is plain static files, any static host can serve `apps/web/dist`, but only Cloudflare is set up and maintained here. If you use another host, copy the headers from [`apps/web/public/_headers`](apps/web/public/_headers) into its configuration.

Throughout this guide, replace `books.example.com` with your own domain.

## Cloudflare Workers

The repository is ready for this: [`wrangler.jsonc`](wrangler.jsonc) tells Cloudflare to serve `apps/web/dist` as static files (there's no Worker script), and [`apps/web/public/_headers`](apps/web/public/_headers) sets the response headers. Requests to static files are free and unlimited on every Cloudflare plan, including Free.

### 1. Create the Worker from GitHub

1. In the Cloudflare dashboard, go to **Workers & Pages** → **Create application** → **Import a repository** (GitHub).
2. Authorize Cloudflare's GitHub app if asked, and pick this repository (or your fork).
3. Fill in the settings:

   | Setting | Value |
   |---|---|
   | Project name | `kind-book-notes` (must match `name` in `wrangler.jsonc`) |
   | Production branch | `main` |
   | Build command | `pnpm install --frozen-lockfile && pnpm run build` |
   | Deploy command | `npx wrangler deploy` (the default) |
   | Root directory | leave empty (the repository root) |

4. Click **Save and Deploy**, and follow the build log.

`pnpm run build` runs the parser tests before building the site. If a test fails, the build stops and the version that's live keeps running.

When it finishes, the site is live at a free address like `kind-book-notes.<your-account>.workers.dev`. That address is fine for testing.

### 2. Add your domain

Your domain has to be on Cloudflare (its DNS managed there).

1. Open the Worker → **Settings** → **Domains & Routes** → **Add** → **Custom Domain**.
2. Enter `books.example.com` and confirm.

Cloudflare creates the DNS record and the HTTPS certificate for you. If the hostname already has a DNS record (for example a CNAME you made earlier), delete that record first.

### 3. Check it

- Open your domain, drop a Kindle export, and try **Copy Markdown** and **Download .md**.
- In the browser's developer tools → Network, converting a book should show no requests at all. That's the Content Security Policy at work.

### Updating

Push or merge to `main`, and Cloudflare builds and deploys it. Pushes to other branches get preview builds on their own URL (if preview builds are on), without touching the live site.

Visitors get a new version on their next page load: `index.html` is never cached, while the asset files have a content hash in their names and are cached for a year.

### Moving to a new domain

Example: moving from `books.example.com` to `newdomain.com`. Nothing in the code changes.

1. **Get the domain onto Cloudflare.** Cloudflare Registrar sells at cost and sets up DNS automatically. A domain bought elsewhere needs its nameservers pointed to Cloudflare first.
2. **Add it to the Worker:** Settings → Domains & Routes → Add → Custom Domain → `newdomain.com`. Add `www.newdomain.com` too if you want it.
3. **Check** that `https://newdomain.com` works.
4. **Redirect the old address.** Remove `books.example.com` from the Worker's custom domains. Then in Cloudflare → the old domain → **Rules** → **Redirect Rules** → **Create rule**:
   - When: hostname equals `books.example.com`
   - Then: dynamic redirect to `concat("https://newdomain.com", http.request.uri.path)`, status **301**.

   The redirect rule needs a proxied DNS record for the old hostname to act on. If removing the custom domain deleted it, add one back: type `AAAA`, name `books`, content `100::`, Proxied. That address doesn't lead anywhere; it only lets Cloudflare see the request so the rule can redirect it.

   Do the same for `www.newdomain.com` → `https://newdomain.com` if you want a single canonical address.
5. **Update links** that point to the old address, such as the "Live" link in the README.

Good to know: people's saved options and theme are stored in their browser per address. After a move they see the defaults once and set them again.
