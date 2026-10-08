# Deploying

Kind Book Notes is a static site in a small Docker image. The [Dockerfile](Dockerfile) builds the app (running the parser tests first) and serves the result with Caddy on **port 80, plain HTTP**. Anything that can run a Docker image and put HTTPS in front of it can host it.

These steps use **[Coolify](https://coolify.io)** with **Cloudflare** for DNS, because that's the reference setup. If you use something else, see [Other Docker hosts](#other-docker-hosts): the container is the same everywhere.

The domain isn't in the code anywhere. You set it in your hosting tool and your DNS, which also makes changing it later easy (see [Moving to a new domain](#moving-to-a-new-domain)).

Throughout this guide, replace `books.example.com` with your own domain.

## Deploy with Coolify

### 1. DNS (Cloudflare)

In Cloudflare → your domain → **DNS** → **Records** → **Add record**:

| Type | Name | Content | Proxy |
|---|---|---|---|
| A | `books` (the subdomain part) | your server's IP address | Proxied (orange cloud) |

Under **SSL/TLS** → **Overview**, use **Full (strict)**. If other apps on your Coolify server already work behind Cloudflare, this is already set.

### 2. Create the application

1. **Projects** → pick or create a project → **+ New**.
2. Choose how Coolify gets the code:
   - **Private Repository (with GitHub App)**: recommended even for a public repository, because the GitHub App sets up automatic deploys on push for you. Pick the repository and the branch **`main`**.
   - **Public Repository**: paste the repository URL and use branch `main`. For automatic deploys you then add a webhook yourself (Coolify shows the URL under **Webhooks**).
   - Deploying from a fork works the same way.
3. **Build Pack:** `Dockerfile`. Base directory `/`, Dockerfile location `/Dockerfile`.
4. **Ports Exposes:** `80`.
5. **Domains:** `https://books.example.com`
6. Check that **Auto Deploy** is on (Configuration → Advanced).
7. Click **Deploy** and follow the build log. The parser tests run during the build: if they fail, the deploy stops and the previous version keeps running.

### 3. Check it

- Open your domain, drop a Kindle export, and try **Copy Markdown** and **Download .md**.
- In the browser's developer tools → Network, converting a book should show no requests at all. That's the privacy promise working: the server's Content Security Policy blocks the page from connecting anywhere.

### Updating

Push or merge to `main`. Coolify rebuilds and redeploys automatically. Visitors get the new version on their next page load: `index.html` is never cached, while the hashed asset files are cached for a year.

## Other Docker hosts

The image needs nothing special: no environment variables, no volumes, no database.

```sh
docker build -t kind-book-notes .
docker run -d --restart unless-stopped -p 8080:80 kind-book-notes
# open http://localhost:8080
```

To put it online, run it behind any reverse proxy that terminates HTTPS (Caddy, Traefik, nginx, a Cloudflare Tunnel, or your platform's built-in proxy) and forward your domain to the container's port 80. The image includes a health check, so orchestrators can tell when it's ready.

## Moving to a new domain

Example: moving from `books.example.com` to `newdomain.com`. Nothing in the app or the image changes.

1. **Get the domain.** If you use Cloudflare, Cloudflare Registrar sells at cost and puts the domain in your account with DNS ready.
2. **Add DNS records** for the new domain:

   | Type | Name | Content | Proxy |
   |---|---|---|---|
   | A | `@` | your server's IP address | Proxied |
   | CNAME | `www` | `newdomain.com` | Proxied |

   On Cloudflare, set **SSL/TLS** → **Overview** to **Full (strict)** for the new domain too.
3. **Add the domain in Coolify.** In the app → **Configuration** → **Domains**, list all of them, separated by commas:
   `https://newdomain.com,https://www.newdomain.com,https://books.example.com`
   Save, then **Redeploy** so the proxy picks up the new names. Keep the old domain for now so nothing breaks while DNS settles.
4. **Check** that `https://newdomain.com` works.
5. **Redirect the old address.** In Cloudflare → the old domain → **Rules** → **Redirect Rules** → **Create rule**:
   - When: hostname equals `books.example.com`
   - Then: dynamic redirect to `concat("https://newdomain.com", http.request.uri.path)`, status **301**.

   Add the same kind of rule for `www.newdomain.com` → `https://newdomain.com` if you want a single canonical address.
6. **Update links** that point to the old address, for example the "Live" link in the README.
7. **Later (optional):** remove the old domain from Coolify's list. Keep the redirect rule and its DNS record so old links and bookmarks keep working.

Good to know: people's saved options and theme are stored in their browser per address. After a move they see the defaults once and set them again.
