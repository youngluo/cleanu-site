<div align="center">
  <img src="web/assets/icon.webp" width="128" height="128" alt="CleanU">
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
pnpm dev        # http://localhost:5173/
pnpm build      # the artifact lands in dist/ — publish dist/ only
pnpm preview    # static server to check the built artifact
```

Both pages have Simplified Chinese and English versions. Chinese uses `/index.html` and `/changelog.html`; English uses `/index.en.html` and `/changelog.en.html`. `/` stays Chinese. Browser preferences never redirect visitors.

Templates live in `web/pages/`, with text in `web/locales/{zh-CN,en}.json`. Editing either regenerates the HTML and reloads the development page. `web/.generated/` is ignored derived output: do not edit or commit it. Builds validate translation keys and parameters before passing four real HTML entries to Vite and flattening them into `dist/`.

Local builds may omit `SITE_URL`, in which case SEO language alternates are omitted. To verify publication metadata, set `SITE_URL` to the real public HTTPS address, including its deployment subpath. The Pages workflow obtains it from `actions/configure-pages`'s `base_url` and sets `REQUIRE_SITE_URL=true` to reject missing or invalid configuration.

Run `pnpm test` to check generation, escaping, translation contracts and invalid references. Screenshots remain the actual Chinese UI; GitHub Release content stays in its original language. SEO alternates do not change relative navigation.
