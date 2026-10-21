<div align="center">
  <img src="public/assets/icon.webp" width="128" height="128" alt="CleanU">
  <h1>CleanU</h1>
  <p>A safe and transparent macOS menu bar cleanup app.</p>
  <p>English&nbsp;&nbsp;|&nbsp;&nbsp;<a href="README-zh_CN.md">简体中文</a></p>
</div>

CleanU is a safe, transparent macOS menu bar cleanup app for macOS 13+, supporting Apple Silicon and Intel Macs.

- Scan caches, temporary files, developer-tool caches, project artifacts, app leftovers, installers, archives, and large files.
- Review results by cache cleanup, project cleanup, app leftovers, and storage analysis, with full paths and actual sizes.
- Scans are read-only. Cleanup requires selection and confirmation, then revalidates each item. Files move to the Trash; Time Machine snapshots use the system's thinning process. Everything runs with the current user's permissions.

## Local development

The website uses Astro to generate static Chinese and English versions of the home, changelog, privacy, and support pages.

```bash
pnpm install
pnpm dev        # http://localhost:4321/
pnpm test       # Run project checks
pnpm build      # Generate dist/
pnpm preview    # Preview the build locally
```

## Purchase configuration

Purchases default to closed. Downloads and existing customers' direct Dodo license checks do not depend on the switch. Public defaults live in `src/data/purchase-config.json`; nonempty environment variables override them. Keep `PURCHASE_ENABLED=false` until configuration, a compatible released app, and real purchase-to-activation acceptance are ready.

| Variable | Value |
| --- | --- |
| PURCHASE_ENABLED | false by default; true to open purchases |
| DODO_ENVIRONMENT | live for public purchases |
| DODO_BUSINESS_ID / DODO_PRODUCT_ID | Real public IDs matching the app |
| DODO_PAYMENT_LINK | The official product's HTTPS Payment Link |
| LICENSE_MIN_APP_VERSION | Minimum released license-compatible app version |
| PURCHASE_ACCEPTANCE_REFERENCE | Location of completed real purchase and activation evidence |
| SITE_URL | Public HTTPS address, including any deployment base |

Purchase support email is configured in the Dodo dashboard only; it is not stored in the site or app repositories. Merchant API keys belong only in trusted management connections, never the site, app, or repository. Obtain test checkout links from the Dodo dashboard or an actual API response; do not guess their host. Public purchases reject test mode.

Publish and download-verify the compatible app before opening purchases through the full Publish workflow. Release sync, tests, Astro build, DMG restoration, static-page checks, and appcast verification remain required. Run `pnpm site:check` after building to check all twelve pages, local links, and return headers. Use the same workflow to close purchases while retaining downloads, activation guidance, and support. Closing purchases does not revoke licenses.
