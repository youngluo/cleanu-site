<div align="center">
  <img src="public/assets/icon.webp" width="128" height="128" alt="CleanU">
  <h1>CleanU</h1>
  <p>A safe and transparent macOS menu bar cleanup app.</p>
  <p>English&nbsp;&nbsp;|&nbsp;&nbsp;<a href="README-zh_CN.md">简体中文</a></p>
</div>

CleanU is a disk-cleaning tool that lives in the macOS menu bar. One deep scan lists the cleanable items and the startup disk's usage together, every row carrying its full path and its actual size; nothing moves to the Trash until you tick the rows and confirm.

## Features

- **Eight scan sources**: caches, temporary files, developer-tool caches, project build artifacts, app leftovers, installers, archives, and large files.
- **Four result groups**: cache cleanup, project cleanup, app leftovers, and storage analysis. Each row lists the item count and the size. Typical entries are iOS Simulators, Xcode iOS Device Support, DerivedData, and npm and Homebrew caches.
- **Platform**: macOS 13+, on both Apple Silicon and Intel.

## Safety boundaries

Five boundaries on the homepage spell out what CleanU does on this Mac:

1. **Scanning is read-only** — it reads directory and file attributes only, and writes, moves, and deletes nothing.
2. **Cleaning needs an explicit confirmation** — a candidate is processed only after you confirm it; there is no background auto-cleaning.
3. **Re-checked before executing** — candidates are validated once more before anything is touched, and any row whose path or size no longer matches is dropped.
4. **Trash only** — confirmed files go to the Trash and can be put back; Time Machine snapshots are slimmed the system's own way and never go to the Trash.
5. **No elevation** — it runs with the current user's permissions and never asks for an admin password; paths it cannot read simply don't appear in the results.

## Local development

```bash
pnpm install
pnpm dev        # http://localhost:4321/
pnpm build      # the artifact lands in dist/ — publish dist/ only
pnpm preview    # static server to check the built artifact
```

All four pages have Simplified Chinese and English versions. Simplified Chinese is the default locale at `/`, `/changelog/`, `/privacy/` and `/support/`; English uses `/en/`, `/en/changelog/`, `/en/privacy/` and `/en/support/`. Browser preferences never redirect visitors.

Astro uses its default root-level `src/` and `public/` directories. Routes live in `src/pages/`; default-locale pages stay at the root and English pages live under `src/pages/en/`. Shared page components and the layout are under `src/components/` and `src/layouts/`. Text lives in `src/locales/{zh-CN,en}.json`; page-specific scripts and styles sit beside their components, shared browser scripts live in `src/common/`, and build-time validation and tests live in the root `scripts/` directory. Site-wide shared styles live in `src/styles/site.css`, and static assets live in `public/`. Astro's i18n helpers generate language-aware links, while the build validates translation keys and interpolation parameters and writes directory-based static pages to `dist/`.

Local builds may omit `SITE_URL`, in which case SEO language alternates are omitted. To verify publication metadata, set `SITE_URL` to the real public HTTPS address, including its deployment subpath. The publish workflow reads the repository variable `SITE_URL` and sets `REQUIRE_SITE_URL=true` to reject missing or invalid configuration.

Run `pnpm test` to check translation contracts, public URL validation and page/asset path mapping. Screenshots remain the actual Chinese UI; release notes have reviewed Chinese and English versions. SEO alternates do not change relative navigation.

## Bilingual releases and Pages downloads

The pipeline is `merge app release PR → test/version/DMG/tag/Release → notify site → read latest Release's tagged JSON and DMG → static Astro build → verify → Pages deploy`.

The app's root changelogs.json holds the full bilingual history and the latest installer's name, size and SHA-256. The model generates only new notes; JSON is committed and tagged with the version and appcast. The GitHub Release body is English only and its sole attachment is the DMG. The site queries the latest published stable Release and reads JSON at that tag, never unshipped main data, a release-data branch or CI cache.

Every deployment renders static bilingual history, then restores only the latest DMG after Astro finishes. Size, SHA-256 and the 25 MiB limit are verified before writing dist/downloads/VERSION/CleanU-VERSION.dmg and dist/updates/appcast.json. Home and universal/arm64/x86_64 feed entries share the public file. Previously published packages retain their original names. All notes remain, while obsolete download links are removed. Website-only rebuilds restore the same installer; failure preserves the previous live deployment.

Configure:

| Repository | Name | Scope or purpose |
| --- | --- | --- |
| CleanU | GEMINI_API_KEY | Gemini Free Tier incremental bilingual generation |
| CleanU | SITE_DISPATCH_TOKEN | Contents write only on the website repo, for dispatch |
| cleanu-site | CLEANU_RELEASES_TOKEN | Contents read only on the private app repo, for Release/tag JSON and DMG |
| cleanu-site | CLOUDFLARE_API_TOKEN | Cloudflare Pages deployment |
| cleanu-site | CLOUDFLARE_ACCOUNT_ID | Cloudflare account ID |
| cleanu-site variable | SITE_URL | Public HTTPS origin and optional deployment subpath |

Allow Actions to create PRs in the app repository. Never put credentials in source, PUBLIC_* variables or release data. The first full sync requires a new app release whose tag contains root changelogs.json; an older tag without it fails explicitly. App releases automatically start the website Publish workflow. For a manual refresh, run Publish in this repository; it reads the latest app release and runs the full build/deploy path, while also advancing the website's own version and creating its tag and GitHub Release. Automatic app events do not bump the website version.

Deployments are serial and recheck the latest Release/tag catalog revision plus the live appcast immediately before upload. Stale data, downgrade and same-version replacement are rejected. Website code rollbacks follow the complete pipeline. Disable Cloudflare Git automatic builds or other paths bypassing restoration; avoid dashboard rollback to a deployment without the current package.

Local commands (credentials come from the environment):

```bash
pnpm release:sync       # CLEANU_RELEASES_TOKEN reads latest Release's tagged JSON
pnpm test
pnpm build              # SITE_URL selects the public origin and deployment subpath
pnpm release:assets  # Same token restores and verifies the latest DMG
pnpm release:check   # Same token checks the published revision and live feed
```

Offline previews read the empty src/data/changelogs.json or an explicit CLEANU_RELEASES_FILE fixture without networking. pnpm build alone produces pages; production deployment requires synchronization, installer restoration and validation. Files over 25 MiB stop the pipeline without changing storage automatically.

Release code has two modules: `src/data/releases.js` reads and validates the local snapshot and provides download paths for Astro; `scripts/releases.js` runs the sync, assets and check phases for private GitHub metadata, installers and deployment checks. The page data module contains no network requests.
