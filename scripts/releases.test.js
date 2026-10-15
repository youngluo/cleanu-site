import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { downloadPath, loadReleases, maxAssetSize, normalizeReleases } from '../src/data/releases.js';
import { checkProductionRelease, downloadAsset, fetchReleases, restoreLatestRelease } from './releases.js';

const bytes = Buffer.from('verified fixture DMG');
const sha256 = createHash('sha256').update(bytes).digest('hex');
const release = (version = '0.1.0', overrides = {}) => ({
  version, published_at: '2026-10-10T08:00:00Z',
  notes: { 'zh-CN': ['新增更新检查。', '<script>alert("test")</script>'], en: ['Added update checks.', '<script>alert("test")</script>'] },
  asset: { id: 123, name: `CleanU-${version}.dmg`, size: bytes.length, sha256 }, ...overrides,
});
const catalog = (records, sha = 'a'.repeat(40)) => ({ encoding: 'base64', sha, content: Buffer.from(JSON.stringify(records)).toString('base64') });
const fixtureFetch = async () => new Response(bytes);

test('persistent records are whitelisted and ordered by version rather than notification dates', () => {
  const records = normalizeReleases([release('0.1.9', { token: 'private', published_at: '2026-10-12T08:00:00Z' }), release('0.1.10')]);
  assert.deepEqual(records.map((record) => record.version), ['0.1.10', '0.1.9']);
  assert.deepEqual(Object.keys(records[1]), ['version', 'published_at', 'notes', 'asset']);
  assert.ok(!JSON.stringify(records).includes('private'));
});

test('historical notes do not require old packages, but the latest record must have a verified DMG', () => {
  const history = release('0.1.0', { asset: undefined });
  assert.equal(normalizeReleases([history, release('0.2.0')]).length, 2);
  assert.throws(() => normalizeReleases([history]), /Latest release is missing/);
});

test('missing translations, duplicate versions and unsafe file metadata stop builds', () => {
  const invalid = [null, {}, release('01.0.0'), release('1.0.0-beta'), release('0.1.0', { published_at: 'invalid' }),
    release('0.1.0', { notes: { 'zh-CN': ['说明'], en: [] } }), release('0.1.0', { notes: { 'zh-CN': ['说明'] } })];
  for (const field of [{ name: '../file.dmg' }, { name: 'CleanU-0.2.0.dmg' }, { id: 0 }, { size: 0 }, { size: maxAssetSize + 1 }, { sha256: 'invalid' }]) {
    invalid.push(release('0.1.0', { asset: { ...release().asset, ...field } }));
  }
  for (const record of invalid) assert.throws(() => normalizeReleases([record]));
  assert.throws(() => normalizeReleases({}), /must be an array/);
  assert.throws(() => normalizeReleases([release(), release()]), /Duplicate/);
  assert.deepEqual(normalizeReleases([]), []);
});

const published = (version = '0.2.0', overrides = {}) => ({
  id: 42, tag_name: `v${version}`, published_at: '2026-10-14T08:00:00Z',
  assets: [{ id: 789, name: `CleanU-${version}.dmg`, size: bytes.length, digest: `sha256:${sha256}` }], ...overrides,
});

const releaseFetch = (records, metadata = published(), file = catalog(records)) => async (url) => (
  Response.json(url.endsWith('/releases/latest') ? metadata : file)
);

test('read the latest published tag JSON, resolve the DMG ID and ignore older notifications', async () => {
  const calls = [];
  const records = [release('0.1.0', { asset: undefined }), release('0.2.0')];
  delete records[1].asset.id; // The tagged catalog is written before the DMG has an attachment ID.
  const fetchImpl = releaseFetch(records);
  const result = await fetchReleases({ token: 'test-only-token', expectedTag: 'v0.1.0', fetchImpl: async (url, options) => {
    calls.push({ url, options });
    return fetchImpl(url);
  } });
  assert.equal(result.releases[0].version, '0.2.0');
  assert.equal(result.releases[0].asset.id, 789);
  assert.equal(result.releases[0].published_at, '2026-10-14T08:00:00.000Z');
  assert.match(calls[0].url, /youngluo\/cleanu\/releases\/latest$/);
  assert.match(calls[1].url, /contents\/changelogs.json\?ref=v0.2.0$/);
  assert.equal(calls[0].options.headers.Authorization, 'Bearer test-only-token');
  assert.ok(!JSON.stringify(result).includes('test-only-token'));
  assert.match(result.revision, /42:v0.2.0:/);
});

test('missing credentials, unpublished releases, bad catalog and absent notification versions stop sync', async () => {
  await assert.rejects(fetchReleases(), /CLEANU_RELEASES_TOKEN/);
  for (const status of [401, 403, 404, 500]) {
    await assert.rejects(fetchReleases({ token: 'test', fetchImpl: async () => new Response('', { status }) }), new RegExp(`HTTP ${status}`));
  }
  for (const metadata of [published('0.2.0', { draft: true }), published('0.2.0', { prerelease: true }),
    published('0.2.0', { assets: [] }), published('0.2.0', { assets: [{ ...published().assets[0], digest: `sha256:${'b'.repeat(64)}` }] })]) {
    await assert.rejects(fetchReleases({ token: 'test', fetchImpl: releaseFetch([release('0.2.0')], metadata) }));
  }
  for (const data of [{}, catalog([]), catalog([release()])]) {
    await assert.rejects(fetchReleases({ token: 'test', fetchImpl: releaseFetch([], published(), data) }));
  }
  await assert.rejects(fetchReleases({ token: 'test', expectedTag: 'v0.3.0', fetchImpl: releaseFetch([release('0.2.0')]) }), /missing/);
});

test('revision changes if the published tag catalog changes during a build', async () => {
  const options = { token: 'test' };
  const first = await fetchReleases({ ...options, fetchImpl: releaseFetch([release('0.2.0')]) });
  const second = await fetchReleases({ ...options, fetchImpl: releaseFetch([release('0.2.0')], published(), catalog([release('0.2.0')], 'b'.repeat(40))) });
  assert.notEqual(first.revision, second.revision);
});

test('offline snapshots validate both languages', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'cleanu-releases-'));
  const file = join(directory, 'changelogs.json');
  try {
    await writeFile(file, JSON.stringify([release()]));
    assert.equal((await loadReleases(file))[0].notes.en[0], 'Added update checks.');
    await writeFile(file, 'invalid JSON');
    await assert.rejects(loadReleases(file), SyntaxError);
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test('private asset redirects omit the token and accept only GitHub asset hosts', async () => {
  const calls = [];
  const result = await downloadAsset(release().asset, { token: 'secret', fetchImpl: async (url, options) => {
    calls.push({ url, options });
    return calls.length === 1 ? new Response(null, { status: 302, headers: { location: 'https://release-assets.githubusercontent.com/signed.dmg' } }) : new Response(bytes);
  } });
  assert.deepEqual(result, bytes);
  assert.equal(calls[0].options.headers.Authorization, 'Bearer secret');
  assert.equal(calls[1].options.headers, undefined);
  await assert.rejects(downloadAsset(release().asset, { token: 'secret', fetchImpl: async () => new Response(null, {
    status: 302, headers: { location: 'https://example.com/package.dmg' },
  }) }), /Unexpected/);
});

test('missing, corrupted, truncated and oversized downloads are rejected', async () => {
  await assert.rejects(downloadAsset(release().asset), /CLEANU_RELEASES_TOKEN/);
  await assert.rejects(downloadAsset(release().asset, { token: 'test', fetchImpl: async () => new Response('', { status: 404 }) }), /HTTP 404/);
  for (const content of [Buffer.from('corrupt'), Buffer.alloc(bytes.length, 1), Buffer.alloc(bytes.length + 1)]) {
    await assert.rejects(downloadAsset(release().asset, { token: 'test', fetchImpl: async () => new Response(content) }), /mismatch|exceeds/);
  }
});

test('clean rebuilds preserve a legacy filename; a new release uses the filename without a suffix', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'cleanu-deploy-'));
  const legacy = release();
  legacy.asset.name = 'CleanU-0.1.0-universal.dmg';
  const records = normalizeReleases([legacy]);
  const options = { directory, siteUrl: 'https://example.com/site/', token: 'test', fetchImpl: fixtureFetch };
  try {
    for (let build = 0; build < 2; build += 1) {
      await rm(directory, { recursive: true, force: true });
      await mkdir(directory);
      await restoreLatestRelease(records, options);
      assert.deepEqual(await readFile(join(directory, downloadPath(records[0]))), bytes);
    }
    const updated = normalizeReleases([legacy, release('0.2.0')]);
    const appcast = await restoreLatestRelease(updated, options);
    assert.deepEqual(await readdir(join(directory, 'downloads')), ['0.2.0']);
    assert.equal(appcast.version, '0.2.0');
    assert.equal(appcast.assets.universal.url, 'https://example.com/site/downloads/0.2.0/CleanU-0.2.0.dmg');
    assert.deepEqual(appcast.assets.arm64, appcast.assets.universal);
    assert.deepEqual(appcast.assets.x86_64, appcast.assets.universal);
    assert.deepEqual(JSON.parse(await readFile(join(directory, 'updates/appcast.json'))), appcast);
    await assert.rejects(restoreLatestRelease(updated, { ...options, fetchImpl: async () => new Response('bad') }));
    assert.deepEqual(await readFile(join(directory, downloadPath(updated[0]))), bytes);
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test('production guard rejects downgrade and same-version replacement, allows unchanged rebuild and upgrade', async () => {
  const candidate = { version: '0.2.0', assets: { universal: { sha256, size: bytes.length, url: 'https://example.com/current.dmg' } } };
  const options = (data) => ({ siteUrl: 'https://example.com/', fetchImpl: async () => Response.json(data) });
  await checkProductionRelease(candidate, options(candidate));
  await checkProductionRelease(candidate, options({ ...candidate, version: '0.1.0' }));
  await checkProductionRelease(candidate, { siteUrl: 'https://example.com/', fetchImpl: async () => new Response('', { status: 404 }) });
  await assert.rejects(checkProductionRelease(candidate, options({ ...candidate, version: '0.3.0' })), /downgrade/);
  await assert.rejects(checkProductionRelease(candidate, options({ ...candidate, assets: { universal: { ...candidate.assets.universal, sha256: 'b'.repeat(64) } } })), /replace/);
  await assert.rejects(checkProductionRelease(candidate, options({ version: 'invalid' })), /Invalid/);
  await assert.rejects(checkProductionRelease(candidate, { siteUrl: 'https://example.com/', fetchImpl: async () => new Response('', { status: 500 }) }), /HTTP 500/);
});
