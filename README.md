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
