import { readFile } from 'node:fs/promises';
import snapshot from './changelogs.json' with { type: 'json' };

export const maxAssetSize = 25 * 1024 * 1024;

/** Compare stable, canonical three-part versions numerically. */
export function compareVersions(first, second) {
  for (let index = 0; index < 3; index += 1) {
    const difference = Number(first.split('.')[index]) - Number(second.split('.')[index]);
    if (difference) return Math.sign(difference);
  }
  return 0;
}

/** Validate the persistent contract and discard fields not intended for publication. */
export function normalizeReleases(records) {
  if (!Array.isArray(records)) throw new Error('Release data must be an array');
  const versions = new Set();
  const normalized = records.map((record) => {
    const version = record?.version;
    if (typeof version !== 'string' || !/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(version)
      || version.split('.').some((part) => !Number.isSafeInteger(Number(part)))
      || typeof record.published_at !== 'string' || !Number.isFinite(Date.parse(record.published_at))) {
      throw new Error('Invalid published Release data');
    }
    if (versions.has(version)) throw new Error(`Duplicate Release version: ${version}`);
    versions.add(version);
    const notes = {};
    for (const locale of ['zh-CN', 'en']) {
      const entries = record.notes?.[locale];
      if (!Array.isArray(entries) || !entries.length || entries.some((entry) => typeof entry !== 'string' || !entry.trim())) {
        throw new Error(`Missing release notes: ${version} ${locale}`);
      }
      notes[locale] = entries.map((entry) => entry.trim());
    }
    if (notes['zh-CN'].length !== notes.en.length) throw new Error(`Unmatched bilingual entries: ${version}`);
    const asset = record.asset;
    if (asset != null && (![`CleanU-${version}.dmg`, `CleanU-${version}-universal.dmg`].includes(asset.name)
      || (asset.id != null && (!Number.isSafeInteger(asset.id) || asset.id <= 0))
      || !Number.isSafeInteger(asset.size) || asset.size <= 0 || asset.size > maxAssetSize
      || typeof asset.sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(asset.sha256))) {
      throw new Error(`Invalid Release asset or exceeds 25 MiB: ${version}`);
    }
    return {
      version, published_at: new Date(record.published_at).toISOString(), notes,
      ...(asset ? { asset: { name: asset.name, size: asset.size, sha256: asset.sha256, ...(asset.id ? { id: asset.id } : {}) } } : {}),
    };
  }).sort((first, second) => compareVersions(second.version, first.version));
  if (normalized.length && !normalized[0].asset) throw new Error('Latest release is missing its universal DMG metadata');
  return normalized;
}

/** Astro only reads local data; development can use an explicitly supplied fixture. */
export async function loadReleases(file = process.env.CLEANU_RELEASES_FILE) {
  return normalizeReleases(file ? JSON.parse(await readFile(file, 'utf8')) : snapshot);
}

/** A versioned path is used by static home links and the public appcast. */
export function downloadPath(release) {
  return `downloads/${release.version}/${release.asset.name}`;
}
