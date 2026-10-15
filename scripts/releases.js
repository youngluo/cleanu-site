import { createHash } from 'node:crypto';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { compareVersions, downloadPath, loadReleases, maxAssetSize, normalizeReleases } from '../src/data/releases.js';
import { resolveSiteUrl } from './localization.js';

const appRepository = 'youngluo/cleanu';
const releasesFile = new URL('../src/data/changelogs.json', import.meta.url);
const revisionFile = new URL('../.release-revision.json', import.meta.url);

/** Request GitHub metadata without forwarding credentials to another host. */
async function githubRequest(path, { token, fetchImpl = fetch } = {}) {
  if (!token) throw new Error('CLEANU_RELEASES_TOKEN is required to read the private Release');
  const response = await fetchImpl(`https://api.github.com/repos/${path}`, {
    headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${token}`, 'X-GitHub-Api-Version': '2022-11-28' },
    signal: AbortSignal.timeout(15000), redirect: 'error',
  });
  if (!response.ok) throw new Error(`GitHub release metadata failed (HTTP ${response.status})`);
  return response.json();
}

/** Read the JSON at the latest published tag, never unshipped data from main. */
export async function fetchReleases({ token, expectedTag, fetchImpl = fetch } = {}) {
  const options = { token, fetchImpl };
  const release = await githubRequest(`${appRepository}/releases/latest`, options);
  const tag = release.tag_name;
  if (release.draft || release.prerelease || !Number.isSafeInteger(release.id) || release.id <= 0
    || typeof tag !== 'string' || !/^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(tag)) {
    throw new Error('Invalid latest stable Release');
  }
  const file = await githubRequest(`${appRepository}/contents/changelogs.json?ref=${tag}`, options);
  if (file.encoding !== 'base64' || !file.content || !/^[a-f0-9]{40}$/.test(file.sha || '')) {
    throw new Error('Missing tagged changelogs.json');
  }
  const releases = normalizeReleases(JSON.parse(Buffer.from(file.content, 'base64').toString('utf8')));
  if (!releases.length || `v${releases[0].version}` !== tag) throw new Error('Release and catalog versions differ');
  if (expectedTag && !releases.some((record) => `v${record.version}` === expectedTag)) {
    throw new Error(`Published Release ${expectedTag} is missing; stopping deployment`);
  }
  const latest = releases[0];
  const assets = (release.assets || []).filter((asset) => asset.name === latest.asset.name);
  const asset = assets[0];
  if (assets.length !== 1 || !Number.isSafeInteger(asset.id) || asset.id <= 0 || asset.size !== latest.asset.size
    || (asset.state != null && asset.state !== 'uploaded')
    || (asset.digest != null && asset.digest !== `sha256:${latest.asset.sha256}`)) {
    throw new Error('Published DMG metadata does not match the catalog');
  }
  latest.asset.id = asset.id;
  if (typeof release.published_at !== 'string' || !Number.isFinite(Date.parse(release.published_at))) {
    throw new Error('Invalid Release publication date');
  }
  latest.published_at = new Date(release.published_at).toISOString();
  return { releases, revision: `${release.id}:${tag}:${file.sha}:${asset.id}` };
}

/** Restore a private release asset; redirect requests never carry the GitHub token. */
export async function downloadAsset(asset, { token, fetchImpl = fetch } = {}) {
  if (!token) throw new Error('CLEANU_RELEASES_TOKEN is required to restore the latest DMG');
  let response = await fetchImpl(`https://api.github.com/repos/${appRepository}/releases/assets/${asset.id}`, {
    headers: { Accept: 'application/octet-stream', Authorization: `Bearer ${token}`, 'X-GitHub-Api-Version': '2022-11-28' },
    signal: AbortSignal.timeout(120000), redirect: 'manual',
  });
  if (response.status === 302) {
    const target = new URL(response.headers.get('location'));
    if (target.protocol !== 'https:' || target.username || target.password || !target.hostname.endsWith('.githubusercontent.com')) {
      throw new Error('Unexpected private asset redirect');
    }
    response = await fetchImpl(target, { signal: AbortSignal.timeout(120000), redirect: 'error' });
  }
  if (!response.ok || !response.body) throw new Error(`DMG restoration failed (HTTP ${response.status})`);
  const chunks = [];
  let size = 0;
  for await (const chunk of response.body) {
    size += chunk.length;
    if (size > maxAssetSize || size > asset.size) {
      await response.body.cancel().catch(() => {});
      throw new Error('DMG exceeds declared size or 25 MiB');
    }
    chunks.push(chunk);
  }
  const bytes = Buffer.concat(chunks);
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  if (size !== asset.size || sha256 !== asset.sha256) throw new Error('DMG size or SHA-256 mismatch');
  return bytes;
}

/** Put exactly one validated DMG and the matching appcast in the complete deployment. */
export async function restoreLatestRelease(releases, { directory, siteUrl, token, fetchImpl = fetch }) {
  const latest = releases[0];
  if (!latest) throw new Error('Cannot deploy without a latest release');
  const bytes = await downloadAsset(latest.asset, { token, fetchImpl });
  const site = new URL(siteUrl.endsWith('/') ? siteUrl : `${siteUrl}/`);
  const asset = { url: new URL(downloadPath(latest), site).href, size: latest.asset.size, sha256: latest.asset.sha256 };
  const manifest = { version: latest.version, assets: { universal: asset, arm64: asset, x86_64: asset } };
  await rm(join(directory, 'downloads'), { recursive: true, force: true });
  await mkdir(join(directory, 'downloads', latest.version), { recursive: true });
  await writeFile(join(directory, downloadPath(latest)), bytes);
  await mkdir(join(directory, 'updates'), { recursive: true });
  await writeFile(join(directory, 'updates/appcast.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  return manifest;
}

/** Reject a website rebuild that would downgrade or replace a published app version. */
export async function checkProductionRelease(candidate, { siteUrl, fetchImpl = fetch }) {
  const site = siteUrl.endsWith('/') ? siteUrl : `${siteUrl}/`;
  const url = new URL('updates/appcast.json', site);
  url.searchParams.set('deployment_check', Date.now());
  const response = await fetchImpl(url, { cache: 'no-store', signal: AbortSignal.timeout(15000) });
  if (response.status === 404) return; // First deployment has no public appcast.
  if (!response.ok) throw new Error(`Cannot verify production appcast (HTTP ${response.status})`);
  const current = await response.json();
  if (typeof current.version !== 'string' || !/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(current.version)) {
    throw new Error('Invalid production appcast');
  }
  const order = compareVersions(current.version, candidate.version);
  if (order > 0) throw new Error('Candidate would downgrade the production release');
  if (order === 0 && (current.assets?.universal?.sha256 !== candidate.assets.universal.sha256
    || current.assets?.universal?.size !== candidate.assets.universal.size
    || current.assets?.universal?.url !== candidate.assets.universal.url)) {
    throw new Error('Candidate would replace an existing production asset');
  }
}

/** Run one explicit phase of the static release deployment. */
async function run(command) {
  const token = process.env.CLEANU_RELEASES_TOKEN;
  if (command === 'sync') {
    const { releases, revision } = await fetchReleases({ token, expectedTag: process.env.CLEANU_RELEASE_TAG });
    await writeFile(releasesFile, `${JSON.stringify(releases, null, 2)}\n`);
    await writeFile(revisionFile, `${JSON.stringify({ revision })}\n`);
    console.log(`Loaded ${releases.length} bilingual releases; latest v${releases[0].version}`);
  } else if (command === 'assets') {
    await restoreLatestRelease(await loadReleases(), {
      directory: resolve('dist'), siteUrl: resolveSiteUrl(process.env.SITE_URL, true).href, token,
    });
    console.log('Restored and verified the latest DMG and public appcast');
  } else if (command === 'check') {
    const { revision } = await fetchReleases({ token });
    const saved = JSON.parse(await readFile(revisionFile, 'utf8'));
    if (revision !== saved.revision) throw new Error('Release data changed during build; rerun deployment');
    const manifest = JSON.parse(await readFile(new URL('../dist/updates/appcast.json', import.meta.url), 'utf8'));
    await checkProductionRelease(manifest, { siteUrl: resolveSiteUrl(process.env.SITE_URL, true).href });
    console.log('Release revision and production version checks passed');
  } else {
    throw new Error('Usage: node scripts/releases.js {sync|assets|check}');
  }
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  try { await run(process.argv[2]); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
