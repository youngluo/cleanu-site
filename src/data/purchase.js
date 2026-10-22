import publicConfig from './purchase-config.json' with { type: 'json' };
import { resolveSiteUrl } from '../../scripts/localization.js';

const fields = {
  productID: 'DODO_PRODUCT_ID',
  paymentLink: 'DODO_PAYMENT_LINK',
};

const checkoutOrigin = 'https://checkout.dodopayments.com';

function realIdentifier(value) {
  return /^[A-Za-z0-9_-]{1,128}$/.test(value) && !/example|placeholder|change-me/i.test(value);
}

export async function loadPurchaseConfig(environment = process.env) {
  const config = { ...publicConfig };
  if (Object.keys(config).sort().join() !== Object.keys(fields).sort().join()) throw new Error('Unexpected purchase configuration fields');
  for (const [key, name] of Object.entries(fields)) {
    if (environment[name] !== undefined && environment[name] !== '') config[key] = environment[name];
    if (typeof config[key] !== 'string') throw new Error(`Invalid purchase field: ${key}`);
  }
  const enabled = environment.PURCHASE_ENABLED || 'false';
  if (!['true', 'false'].includes(enabled)) throw new Error('PURCHASE_ENABLED must be true or false');
  return { ...config, enabled: enabled === 'true' };
}

/** Validate the live product and checkout links before opening public purchases. */
export function validatePurchaseConfig(config, { siteUrl } = {}) {
  if (!config.enabled) return config;
  if (!realIdentifier(config.productID) || !config.productID.startsWith('pdt_')) {
    throw new Error('Public purchases require a real Dodo product ID');
  }
  checkoutHref(config, siteUrl, 'zh-CN');
  checkoutHref(config, siteUrl, 'en');
  return config;
}

export function checkoutHref(config, siteValue, locale) {
  if (!['zh-CN', 'en'].includes(locale)) throw new Error('Unsupported checkout locale');
  const site = resolveSiteUrl(String(siteValue || ''), true);
  if (!realIdentifier(config.productID)) throw new Error('A verified Dodo Payment Link is required');
  let link;
  try { link = new URL(config.paymentLink); } catch { throw new Error('Invalid Dodo Payment Link'); }
  if (link.origin !== checkoutOrigin || link.username || link.password || link.hash
    || link.pathname.replace(/\/$/, '') !== `/buy/${config.productID}`) throw new Error('Dodo Payment Link host or product does not match');
  const callbacks = ['purchase/complete/', 'en/purchase/complete/'].map((path) => new URL(path, site).href);
  for (const [key, value] of link.searchParams) {
    if ((key === 'quantity' && value === '1') || (key === 'redirect_url' && callbacks.includes(value))) continue;
    throw new Error('Dodo Payment Link contains unexpected query parameters');
  }
  link.search = '';
  link.searchParams.set('quantity', '1');
  link.searchParams.set('redirect_url', callbacks[locale === 'en' ? 1 : 0]);
  return link.href;
}

export async function checkedPurchaseConfig(environment = process.env) {
  const config = await loadPurchaseConfig(environment);
  return validatePurchaseConfig(config, { siteUrl: environment.SITE_URL });
}

export function checkoutHeaders(base = '/') {
  const prefix = base.replace(/\/$/, '');
  return ['purchase/complete', 'en/purchase/complete'].flatMap((path) => ['', '/', '/*'].map((suffix) =>
    `${prefix}/${path}${suffix}\n  Referrer-Policy: no-referrer\n  X-Robots-Tag: noindex, noarchive\n`
  )).join('\n');
}
