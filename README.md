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

Purchases default to closed. Downloads and existing customers' direct Dodo license checks do not depend on the switch. The website always uses production Dodo checkout. Public defaults live in `src/data/purchase-config.json`; nonempty environment variables supply the live product configuration. There is no website environment switch. Keep `PURCHASE_ENABLED=false` until configuration, a compatible released app, and real purchase-to-activation acceptance are ready.

| Variable | Value |
| --- | --- |
| PURCHASE_ENABLED | false by default; true to open purchases |
| DODO_PRODUCT_ID | Real public product ID matching the app |
| DODO_PAYMENT_LINK | The official product's HTTPS Payment Link |
| SITE_URL | Public HTTPS address, including any deployment base |

Purchase support email is configured in the Dodo dashboard only; it is not stored in the site or app repositories. Merchant API keys belong only in trusted management connections, never the site, app, or repository. Test Mode is used by local app development only. The website rejects test checkout hosts and contains no default test product IDs. If purchase email is missing, the support, return, and terms pages link directly to the official Dodo customer portal and contact page.

Publish and download-verify the compatible app before opening purchases through the full Publish workflow. Record app compatibility and purchase-to-activation acceptance in the repository documentation. Release sync, tests, Astro build, DMG restoration, static-page checks, and appcast verification remain required. Run `pnpm site:check` after building to check all twelve pages, local links, and return headers. Use the same workflow to close purchases while retaining downloads, activation guidance, and support. Closing purchases does not revoke licenses.
