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
