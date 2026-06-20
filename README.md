# Tiny Tools

A fast, free, privacy-friendly collection of **20 browser-based utilities** —
calculators, converters, text tools, generators and developer helpers. No
accounts, no tracking by default, and every tool runs entirely in your browser.

Built to be cheap to host on a small Ubuntu VPS and friendly to organic search
traffic, with a dedicated SEO-optimised page per tool.

---

## Highlights

- **20 tools**, each on its own SEO-friendly page with a unique title,
  description, heading, explanation, worked examples and FAQ.
- **Runs in the browser** — calculations never touch a server, so the tools are
  instant and private.
- **Fast & light** — static-data-driven pages, code-split tool components, a
  ~88 kB shared JS baseline, and a container capped at 256 MB RAM.
- **SEO ready** — `sitemap.xml`, `robots.txt`, canonical URLs, Open Graph /
  Twitter cards, and JSON-LD structured data (`WebApplication`, `FAQPage`,
  `BreadcrumbList`, `WebSite` search action).
- **Accessible** — keyboard navigation, visible focus rings, skip link, labelled
  controls, reduced-motion support, and a no-JS-friendly FAQ.
- **Dark mode** with no flash of incorrect theme.
- **Privacy-first** — no cookies, no tracking. Analytics, ads and donations are
  opt-in placeholders that render nothing until you configure them.
- **Hardened** — strict nonce-based Content-Security-Policy, full security
  header set, input-size limits, input sanitisation, and zero use of `eval` or
  unsafe HTML rendering.
- **Translation-ready** architecture (English ships today).

### The tools

| Calculators | Converters | Text | Generators | Developer |
|---|---|---|---|---|
| Percentage | Unit | Word & character counter | Random number | JSON formatter & validator |
| Age | Temperature | Text case converter | Secure password | |
| Date difference | Time zone | Remove duplicate lines | QR code | |
| BMI | Unix timestamp | | | |
| Loan payment | URL encoder/decoder | | | |
| Countdown | Base64 encoder/decoder | | | |
| | Color (HEX/RGB/HSL) | | | |

---

## Tech stack

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** (dark mode via `class`)
- **Docker** + **Docker Compose**
- **Nginx** reverse proxy with HTTP/2, gzip, caching and rate limiting
- **Let's Encrypt** HTTPS via certbot
- **Vitest** (unit), **Playwright** (e2e), **Lighthouse CI** (performance)
- No paid APIs. The only runtime dependency beyond React/Next is `qrcode`.

---

## Project structure

```
.
├── src/
│   ├── app/                 # App Router pages, sitemap, robots, manifest
│   │   ├── tools/[slug]/     # One dynamic, statically-generated page per tool
│   │   ├── category/[category]/
│   │   ├── about|privacy|terms|contact/
│   │   └── layout.tsx, page.tsx, globals.css
│   ├── components/
│   │   ├── tools/            # The 20 interactive tool components (+ renderer)
│   │   └── ui/               # CopyButton, ToolShell, etc.
│   ├── lib/
│   │   ├── tools-logic/      # Pure, unit-tested calculation/conversion logic
│   │   ├── tools.ts          # Central registry: routing + all SEO content
│   │   ├── seo.ts            # Metadata + JSON-LD builders
│   │   ├── site.ts           # Site config from env vars
│   │   └── i18n/             # Locale config + dictionaries (en)
│   └── middleware.ts         # Per-request nonce + Content-Security-Policy
├── tests/{unit,e2e}/
├── nginx/                    # nginx.conf + conf.d + certbot volumes
├── scripts/init-letsencrypt.sh
├── Dockerfile                # Multi-stage, standalone output, non-root
├── docker-compose.yml        # web + nginx + certbot
├── .github/workflows/        # ci.yml, deploy.yml
└── DEPLOYMENT.md             # Full Ubuntu VPS deployment guide
```

Adding a tool is mostly data: add an entry to `src/lib/tools.ts`, write its pure
logic in `src/lib/tools-logic/`, add a component in `src/components/tools/`, and
register it in `src/components/tools/ToolRenderer.tsx`. Routing, the sitemap,
search, categories and structured data update automatically.

---

## One-command production setup

On a fresh **Debian 13.x** or **Ubuntu** VPS — Docker is installed automatically
if it is missing — from the repository root:

```bash
sudo EMAIL=you@botera.md \
  ADMIN_EMAIL=admin@botera.md ADMIN_PASSWORD='choose-a-strong-password' \
  ./scripts/setup.sh
```

`scripts/setup.sh` will, in order: **install Docker Engine + Compose** if not
present (Debian/Ubuntu, via Docker's official script), configure Nginx for the
domain (`botera.md` by default, override with `DOMAIN=`), write `.env`, build the
image, issue a Let's Encrypt certificate, start the stack, and create the admin
account. Use `sudo` so Docker can be installed; if Docker is already set up you
can run it without sudo. Before DNS is pointed at the server, add `SKIP_CERTS=1`
to use a self-signed certificate. Full step-by-step instructions remain in
**DEPLOYMENT.md**.

---

## Community: forum, comments & contact

botera includes public, account-free community features backed by the same
SQLite database, with strong anti-abuse protections:

- **Forum** at `/forum` and `/forum/[slug]` — anyone can start a discussion and
  reply. New threads/replies appear immediately unless the spam filter holds
  them for review.
- **Comments** under every published tutorial (`/linux-tutorials/[slug]`).
- **Contact & "Ask a question"** at `/contact` — an on-site form (no email
  anywhere on the site). Submissions land in the admin **Inbox**.
- **Support CTAs** after each tutorial and forum thread, plus a `/support` page
  and a footer donate button. Each button maps to its own variable so you can
  point them at one Ko-fi page or three different services:
  - **"☕ Buy me a coffee"** → `NEXT_PUBLIC_COFFEE_URL`
  - **"♥ Support with $1"** → `NEXT_PUBLIC_SUPPORT_URL`
  - **Footer donate button** → `NEXT_PUBLIC_DONATE_URL`

  When a variable is empty its button falls back to the on-site `/support` page.
  External links open in a new tab with `rel="noopener noreferrer nofollow"`.
  `scripts/setup.sh` defaults all three to `https://ko-fi.com/zmeigorynyc`
  (override with `KOFI_URL=` / `COFFEE_URL=` / `SUPPORT_URL=` / `DONATE_URL=`).

### How the community content is kept safe

This is the highest-risk surface, so defence is layered:

- **No HTML is ever rendered from user input.** Submissions are stored as plain
  text and rendered through React's normal escaping (never
  `dangerouslySetInnerHTML`, never Markdown), so **stored XSS is impossible** —
  the worst a "payload" can do is display as literal text.
- **Same-origin enforcement** on every public POST (Origin/Referer must match).
- **Honeypot field** + **per-IP rate limiting** (no third-party CAPTCHA).
- **Spam/link heuristic** holds suspicious posts as `pending` (invisible to the
  public) until an admin approves them.
- **Length limits** and control-character stripping on every field.
- **IP capture & blocking.** Every post/comment/message records the real client
  IP (alongside a salted hash). In the admin views each item shows its IP with a
  one-click **Block** button, and `/admin/blocked` lists/adds/removes blocks. A
  blocked IP is rejected from posting **and** shown an "Access restricted" page
  on every non-admin page (the admin area stays reachable so you can't lock
  yourself out). For a hard network-level ban, also add an Nginx `deny <ip>;`.
- **Full moderation** in the admin area: approve / hide / delete comments, forum
  threads and replies; pin / lock threads; read / archive / delete messages.
  Pending counts are badged in the admin nav.

Admin pages: `/admin/comments`, `/admin/forum`, `/admin/inbox`, `/admin/blocked`.

---

## Local development

Requires Node.js 20+.

```bash
npm install
cp .env.example .env.local      # optional: set NEXT_PUBLIC_SITE_URL etc.
npm run dev                     # http://localhost:3000
```

Other scripts:

```bash
npm run build        # production build (standalone output)
npm start            # run the production server
npm run lint         # ESLint (next/core-web-vitals)
npm run typecheck    # tsc --noEmit
npm test             # Vitest unit tests
npm run e2e          # Playwright (builds + starts the app automatically)
npm run lighthouse   # Lighthouse CI assertions
```

---

## Configuration

All configuration is via environment variables (see `.env.example`). Because
`NEXT_PUBLIC_*` values are inlined at build time, set them before building.

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | Canonical/OG/sitemap base URL (no trailing slash). |
| `NEXT_PUBLIC_ANALYTICS_DOMAIN` / `..._SRC` | Cookie-free analytics (e.g. Plausible). Disabled when empty. |
| `NEXT_PUBLIC_DONATE_URL` | Shows the donation button when set. |
| `NEXT_PUBLIC_ENABLE_ADS` | `true` activates the (otherwise placeholder) ad slots. |
| `CMS_DB_PATH` | SQLite database file (runtime). Default `./data/cms.db`; `/app/data/cms.db` in Docker. |
| `CMS_UPLOAD_DIR` | Directory for uploaded tutorial images (runtime). Default `/app/data/uploads` in Docker. |

> **Enabling analytics or ads** loads a third-party script, so add its origin to
> the `script-src` (and `connect-src`) directives in `src/middleware.ts`,
> otherwise the strict CSP will block it.

---

## Security notes

- **Strict CSP**: `src/middleware.ts` issues a fresh nonce per request and sets
  a strict `Content-Security-Policy` (`script-src 'self' 'nonce-…'
  'strict-dynamic'`, `object-src 'none'`, `frame-ancestors 'none'`, etc.). Next
  attaches the nonce to its own scripts automatically. This is why HTML pages are
  rendered per request rather than served as fully static files — the trade-off
  required for a genuinely strict, nonce-based policy. All JS/CSS assets remain
  static and are cached aggressively by Nginx.
- **Headers**: HSTS, `X-Content-Type-Options`, `X-Frame-Options`,
  `Referrer-Policy` and `Permissions-Policy` are set in `next.config.mjs`.
- **Input handling**: every free-text field enforces a maximum length
  (`src/lib/tools-logic/limits.ts`); JSON uses the native parser (never `eval`);
  no user input is ever rendered as HTML.

---

## Internationalisation

The UI is English today but structured for translation: locale config lives in
`src/lib/i18n/config.ts` and UI strings in `src/lib/i18n/dictionaries/en.ts`. To
add a language, create a new dictionary, register it in `src/lib/i18n/index.ts`,
and (optionally) introduce a `[locale]` route segment. Per-tool content can be
localised by extending the registry entries in `src/lib/tools.ts`.

---

## Linux Tutorials CMS

A self-hosted CMS for publishing Linux administration tutorials lives alongside
the tools. It adds an embedded **SQLite** database (via `better-sqlite3`), a
cookie-session **admin area**, a secure **Markdown** pipeline, and a public
tutorials section.

- **Public:** `/linux-tutorials` (listing with search, category/tag/difficulty/
  distribution filters and pagination), `/linux-tutorials/[slug]` (article with
  table of contents, reading time, badges, prev/next, related, share buttons,
  copy-able code blocks and destructive-command warnings), and an RSS feed at
  `/linux-tutorials/rss.xml`. The homepage shows a “Latest Linux Tutorials” feed.
- **Admin:** `/admin` (dashboard), `/admin/tutorials/new`, `/admin/tutorials/[id]/edit`
  (Markdown editor with live preview, autosave, image upload) and
  `/admin/tutorials/[id]/preview`. All admin pages and `/api/admin/*` routes are
  protected; drafts, previews and admin routes are excluded from search engines.

### Security model

Strict, nonce-based CSP applies site-wide. Admin sessions use scrypt-hashed
passwords and HMAC-free opaque tokens stored hashed in the database; mutations
require a CSRF double-submit token and a same-origin check. Markdown is rendered
server-side (marked → highlight.js → sanitize-html), so no user HTML or scripts
survive and **no submitted code is ever executed**. Uploads are restricted by
type and size and stored with server-generated names (no path traversal). The
login endpoint is rate-limited.

### How to create an admin account

The app migrates the database automatically on first boot. Create an admin with
the self-contained script (works on the host or inside the container):

```bash
# Docker (recommended): runs inside the running web container
docker compose exec web node scripts/create-admin.mjs admin@botera.md 'a-strong-password'

# Local development
node scripts/create-admin.mjs admin@botera.md 'a-strong-password'
```

Re-running with an existing email updates that admin’s password. Then sign in at
`/admin/login`.

### How to publish a tutorial

1. Sign in at `/admin/login` and click **New tutorial**.
2. Enter a title — the slug is generated automatically (editable; duplicates are
   prevented, and the slug stays stable if you later change the title).
3. Write the body in Markdown. Supported: headings, lists, links, tables,
   blockquotes, inline code, fenced code blocks with syntax highlighting (Bash,
   Shell, YAML, JSON, Nginx, Dockerfile, Python, JavaScript, INI/config, SQL,
   diff), images, and GitHub-style callouts:

   ```markdown
   > [!WARNING]
   > This command can lock you out of the server.
   ```

   Code blocks containing destructive commands (e.g. `rm -rf /`, `mkfs`, `dd`)
   automatically get a red warning banner.
4. Set difficulty, distribution, category, tags, author and (optionally) SEO
   title/description and a cover image.
5. Use **Show preview** for a live render, or **Open preview** for the full page.
6. Click **Publish** (or save as a draft). Drafts never appear publicly, in the
   feed, the sitemap or RSS. Existing drafts autosave while you edit.

### How to manage categories and tags

- **Categories** are seeded on first boot (Getting Started, Networking, Security,
  …). Add more via the API used by the editor:
  `POST /api/admin/categories { "name": "Monitoring" }`, or remove with
  `DELETE /api/admin/categories/:id`. Assign a category per tutorial in the editor.
- **Tags** are free-form: type comma-separated tags in the editor and they are
  created automatically and de-duplicated. Tag and category pages are reachable
  via `/linux-tutorials?tag=<slug>` and `/linux-tutorials?category=<slug>`.

### How images are stored

Cover images can be either an external `https://` URL or an uploaded file.
Uploads (PNG/JPEG/WebP/GIF/SVG, max 3 MB) are validated, given a random
filename and written to `CMS_UPLOAD_DIR` (default `/app/data/uploads`, on the
`cms-data` Docker volume). They are served read-only via
`/api/uploads/<file>` with caching and `nosniff`.

### How to back up tutorial content

All CMS state is the SQLite database plus the uploads directory, both on the
`cms-data` volume. Back them up with a single tarball:

```bash
# Back up the database + uploads from the volume
docker run --rm -v codex_cms-data:/data -v "$PWD":/backup alpine \
  tar czf /backup/cms-backup-$(date +%F).tar.gz -C /data .

# Restore
docker run --rm -v codex_cms-data:/data -v "$PWD":/backup alpine \
  sh -c 'cd /data && tar xzf /backup/cms-backup-YYYY-MM-DD.tar.gz'
```

(The volume name is `<project>_cms-data`; check `docker volume ls`.) For a quick
DB-only snapshot you can also copy the file:
`docker compose exec web sh -c 'cp /app/data/cms.db /app/data/cms-backup.db'`.

### How to deploy the database changes

Migrations live in `src/lib/cms/migrations.ts` and are applied automatically and
idempotently the first time the app opens the database after a deploy — there is
no manual migration step. To add a schema change, append a new `Migration` entry
with the next `id`; it runs on the next boot and is recorded in
`schema_migrations`. Tutorial edits keep the last 20 revisions per tutorial in
`tutorial_revisions`.

---

## 🚀 Launch checklist

**Content & branding**
- [ ] Replace `tinytools.example` with your domain across `.env`,
      `nginx/conf.d/tinytools.conf` and the contact email in
      `src/app/contact/page.tsx`.
- [ ] Review the About / Privacy / Terms / Contact pages for your jurisdiction.
- [ ] Update social handles in `src/lib/site.ts` if used.

**Build & quality**
- [ ] `npm run lint && npm run typecheck && npm test` all pass.
- [ ] `npm run build` succeeds.
- [ ] `npm run e2e` passes locally or in CI.
- [ ] `npm run lighthouse` meets the performance/SEO/accessibility thresholds.

**SEO**
- [ ] `NEXT_PUBLIC_SITE_URL` is set to the production HTTPS URL.
- [ ] `https://yourdomain/robots.txt` and `/sitemap.xml` resolve.
- [ ] Submit the sitemap in Google Search Console / Bing Webmaster Tools.
- [ ] Validate a tool page with the Rich Results test (FAQ + breadcrumbs).

**Infrastructure**
- [ ] DNS `A`/`AAAA` records point at the server (see DEPLOYMENT.md §1).
- [ ] Docker + Compose installed; firewall allows 80/443 (§2).
- [ ] HTTPS issued via `scripts/init-letsencrypt.sh` (§5); auto-renewal running.
- [ ] `curl -sI https://yourdomain` shows the CSP + HSTS headers.

**Linux Tutorials CMS**
- [ ] An admin account created (`docker compose exec web node scripts/create-admin.mjs …`).
- [ ] First tutorial published and visible at `/linux-tutorials` and in the homepage feed.
- [ ] `/linux-tutorials/rss.xml` resolves; drafts are excluded.
- [ ] `cms-data` volume backup verified (see “How to back up tutorial content”).

**Operations**
- [ ] Deploy secrets configured if using the GitHub Actions workflow (§10).
- [ ] Certificate + `.env` backup taken (§8); rollback steps understood (§9).

**Optional**
- [ ] Configure cookie-free analytics and add its origin to the CSP.
- [ ] Set a donation URL.
- [ ] Decide on advertising and update the CSP/privacy policy accordingly.

---

## License

MIT — see the `license` field in `package.json`. The site's written content
(tool explanations, FAQs, legal pages) is original to this project. You are free
to use, modify and self-host it.
