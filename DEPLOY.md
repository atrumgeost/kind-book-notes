# Deploying

Kind Book Notes is a static site. The [Dockerfile](Dockerfile) builds it (running the parser tests first) and serves the result with Caddy on port 80. Coolify builds the image from GitHub and its proxy handles HTTPS. Cloudflare sits in front for DNS.

**The domain isn't in the code anywhere.** It lives in two places only: Coolify's domain setting and Cloudflare DNS. That's what makes changing it later easy (see [Moving to a new domain](#moving-to-a-new-domain)).

Current address: **https://books.katanalab.dev**

## First deployment

### 1. Cloudflare DNS

In Cloudflare → `katanalab.dev` → **DNS** → **Records** → **Add record**:

| Type | Name | Content | Proxy |
|---|---|---|---|
| A | `books` | your VPS's IP address | Proxied (orange cloud) |

Under **SSL/TLS** → **Overview**, the mode should be **Full (strict)**. If your other katanalab.dev apps on Coolify already work, this is already set; leave it as it is.

### 2. Coolify application

1. **Projects** → pick a project (or create one) → **+ New** → **Private Repository (with GitHub App)**.
   The repository is private, so Coolify needs its GitHub App to read it. If you haven't connected it yet, Coolify walks you through it under **Sources**.
2. Choose `atrumgeost/kind-book-notes` and the branch **`main`**.
3. **Build Pack:** `Dockerfile`. Base directory `/`, Dockerfile location `/Dockerfile`.
4. **Ports Exposes:** `80`.
5. **Domains:** `https://books.katanalab.dev`
6. Check **Auto Deploy** is on (Configuration → Advanced). With the GitHub App, every push to `main` redeploys.
7. Click **Deploy** and follow the build log. The parser tests run during the build: if they fail, the deploy stops and the old version keeps running.

### 3. Check it

- Open https://books.katanalab.dev, drop an export, and try **Copy** and **Download .md**.
- In the browser's developer tools → Network, converting a book should show no requests at all. That's the privacy promise working.

## Updating

Push (or merge) to `main`. Coolify rebuilds and redeploys on its own. Visitors get the new version on their next page load, because `index.html` is never cached while the hashed asset files are cached for a year.

## Moving to a new domain

Example: moving from `books.katanalab.dev` to `kindbooknotes.com`. Nothing in the app needs to change.

1. **Buy the domain.** Cloudflare Registrar is easiest: it sells at cost, and the domain lands in your Cloudflare account with DNS already set up.
2. **Add DNS records** in Cloudflare → `kindbooknotes.com` → **DNS**:

   | Type | Name | Content | Proxy |
   |---|---|---|---|
   | A | `@` | your VPS's IP address | Proxied |
   | CNAME | `www` | `kindbooknotes.com` | Proxied |

   Set **SSL/TLS** → **Overview** to **Full (strict)** for the new domain too.
3. **Add the domain in Coolify.** In the app → **Configuration** → **Domains**, list both, separated by a comma:
   `https://kindbooknotes.com,https://www.kindbooknotes.com,https://books.katanalab.dev`
   Save, then **Redeploy** so the proxy picks up the new names. Keep the old one for now so nothing breaks while DNS settles.
4. **Check** that https://kindbooknotes.com works.
5. **Redirect the old address.** In Cloudflare → `katanalab.dev` → **Rules** → **Redirect Rules** → **Create rule**:
   - When: hostname equals `books.katanalab.dev`
   - Then: dynamic redirect to `concat("https://kindbooknotes.com", http.request.uri.path)`, status **301**.

   Do the same for `www.kindbooknotes.com` → `https://kindbooknotes.com` if you want one canonical address.
6. **Update the links** in the repository: search for `katanalab` (the README and this file) and replace it with the new domain.
7. **Optional cleanup** after a few months: remove `books.katanalab.dev` from Coolify's domain list. Keep the Cloudflare redirect rule and the DNS record so old links and bookmarks keep working.

Good to know: people's saved options and theme live in their browser, tied to the address. After the move they'll see the defaults once and set them again.

## Testing the Docker image locally

```sh
docker build -t kind-book-notes .
docker run --rm -p 8080:80 kind-book-notes
# open http://localhost:8080
```
