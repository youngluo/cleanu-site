import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';
import { checkoutHeaders, checkoutHref, loadPurchaseConfig, validatePurchaseConfig } from '../src/data/purchase.js';

const config = {
  enabled: true, environment: 'live', businessID: 'bus_fixture', productID: 'pdt_fixture',
  paymentLink: 'https://checkout.dodopayments.com/buy/pdt_fixture',
  minimumAppVersion: '0.2.0', acceptanceReference: 'acceptance-fixture',
};
const context = { siteUrl: 'https://cleanu.ls63.cc/', appVersion: '0.2.1' };

test('routine checks stay out of pricing copy while purchase terms disclose the offline limit', async () => {
  for (const locale of ['zh-CN', 'en']) {
    const copy = JSON.parse(await readFile(new URL(`../src/locales/${locale}.json`, import.meta.url), 'utf8'));
    assert.doesNotMatch(JSON.stringify(copy.index), /七天|seven days|每日|daily|24 hours/i);
    assert.doesNotMatch(JSON.stringify(copy.privacy), /七天|seven days|每日|daily|24 hours/i);
    assert.match(copy.terms.connectionBody, /七天|seven days/i);
    assert.doesNotMatch(copy.terms.connectionBody, /每日|daily|24/);
  }
});

test('purchases default closed and missing live inputs block opening', async () => {
  const value = await loadPurchaseConfig({});
  assert.equal(value.enabled, false);
  assert.doesNotThrow(() => validatePurchaseConfig(value));
  assert.throws(() => validatePurchaseConfig({ ...value, enabled: true }, context), /live environment/);
  await assert.rejects(() => loadPurchaseConfig({ PURCHASE_ENABLED: 'yes' }), /true or false/);
});

test('opening requires matching live product, compatible released app and acceptance', () => {
  assert.doesNotThrow(() => validatePurchaseConfig(config, context));
  for (const changes of [
    { environment: 'test' }, { businessID: '' }, { productID: 'pdt_example' },
    { minimumAppVersion: '0.3.0' }, { acceptanceReference: '' },
    { paymentLink: 'https://test.checkout.dodopayments.com/buy/pdt_fixture' },
  ]) assert.throws(() => validatePurchaseConfig({ ...config, ...changes }, context));
  assert.throws(() => validatePurchaseConfig(config, { ...context, appVersion: undefined }));
});

test('purchase support is hosted by Dodo rather than embedded in the site', async () => {
  const loaded = await loadPurchaseConfig({});
  assert.equal(Object.keys(loaded).some((key) => /support|email/i.test(key)), false);
  for (const path of ['../src/components/CheckoutPage/index.astro', '../src/components/SupportPage/index.astro']) {
    const source = await readFile(new URL(path, import.meta.url), 'utf8');
    assert.doesNotMatch(source, /mailto:/);
  }
  const workflow = await readFile(new URL('../.github/workflows/publish.yml', import.meta.url), 'utf8');
  assert.doesNotMatch(workflow, /PURCHASE_SUPPORT_EMAIL/);
});

test('checkout fixes one item and a language-specific return inside root or deployment base', () => {
  for (const base of ['/', '/cleanu-site/']) {
    for (const locale of ['zh-CN', 'en']) {
      const site = `https://cleanu.ls63.cc${base}`;
      const url = new URL(checkoutHref(config, site, locale));
      assert.equal(url.origin, 'https://checkout.dodopayments.com');
      assert.equal(url.pathname, '/buy/pdt_fixture');
      assert.equal(url.searchParams.get('quantity'), '1');
      assert.equal(url.searchParams.get('redirect_url'), `${site}${locale === 'en' ? 'en/' : ''}purchase/complete/`);
    }
  }
});

test('payment links reject host spoofing, credentials, wrong product and injected parameters', () => {
  for (const link of [
    'http://checkout.dodopayments.com/buy/pdt_fixture',
    'https://checkout.dodopayments.com.evil.invalid/buy/pdt_fixture',
    'https://user@checkout.dodopayments.com/buy/pdt_fixture',
    'https://checkout.dodopayments.com/buy/pdt_other',
    `${config.paymentLink}?quantity=2`, `${config.paymentLink}?email=private`,
    `${config.paymentLink}?redirect_url=https://elsewhere.invalid/`, `${config.paymentLink}#secret`,
  ]) assert.throws(() => checkoutHref({ ...config, paymentLink: link }, context.siteUrl, 'en'));
  assert.throws(() => checkoutHref(config, 'https://localhost/', 'en'));
  assert.throws(() => checkoutHref(config, context.siteUrl, 'fr'));
});

test('verified test links preserve language and base while public purchases still reject test mode', () => {
  const testConfig = { ...config, environment: 'test', paymentLink: 'https://test.checkout.dodopayments.com/buy/pdt_fixture' };
  for (const base of ['/', '/cleanu-site/']) {
    for (const locale of ['zh-CN', 'en']) {
      const site = `https://cleanu.ls63.cc${base}`;
      const url = new URL(checkoutHref(testConfig, site, locale));
      assert.equal(url.origin, 'https://test.checkout.dodopayments.com');
      assert.equal(url.searchParams.get('quantity'), '1');
      assert.equal(url.searchParams.get('redirect_url'), `${site}${locale === 'en' ? 'en/' : ''}purchase/complete/`);
    }
  }
  assert.throws(() => checkoutHref({ ...testConfig, paymentLink: config.paymentLink }, context.siteUrl, 'en'));
  assert.throws(() => checkoutHref({ ...config, paymentLink: testConfig.paymentLink }, context.siteUrl, 'en'));
  assert.throws(() => validatePurchaseConfig(testConfig, context), /live environment/);
});

test('return initialization keeps only a status enum, clears query, fragment and history state', async () => {
  const source = await readFile(new URL('../src/layouts/SiteLayout.astro', import.meta.url), 'utf8');
  const script = [...source.matchAll(/<script is:inline>([\s\S]*?)<\/script>/g)].map((match) => match[1])
    .find((value) => value.includes('URLSearchParams'));
  for (const status of ['succeeded', 'processing', 'failed', 'cancelled', 'unknown', '<script>alert(1)</script>', '']) {
    const dataset = {};
    const historyCalls = [];
    vm.runInNewContext(script, {
      URLSearchParams, document: { documentElement: { dataset } },
      location: { pathname: '/en/purchase/complete/', search: `?status=${encodeURIComponent(status)}&email=private%40example.com&license_key=SECRET&payment_id=ORDER`, hash: '#SECRET' },
      history: { replaceState: (...args) => historyCalls.push(args) },
    });
    assert.equal(dataset.checkoutStatus, ['succeeded', 'processing', 'failed', 'cancelled'].includes(status) ? status : 'unknown');
    assert.deepEqual(historyCalls, [[null, '', '/en/purchase/complete/']]);
    assert.equal(JSON.stringify(dataset).includes('SECRET'), false);
  }
  assert.ok(source.indexOf('URLSearchParams') < source.indexOf('<link rel="icon"'));
  assert.match(source, /name="referrer" content="no-referrer"/);
});

test('Cloudflare response rules cover both languages including deployment subpaths', () => {
  for (const base of ['/', '/cleanu-site/']) {
    const headers = checkoutHeaders(base);
    for (const path of ['purchase/complete', 'en/purchase/complete']) {
      assert.ok(headers.includes(`${base}${path}/\n`));
      assert.ok(headers.includes(`${base}${path}/*\n`));
    }
    assert.equal((headers.match(/Referrer-Policy: no-referrer/g) || []).length, 6);
  }
});
