export const pageNames = ['index', 'changelog', 'privacy', 'support', 'checkout', 'terms'];
const pageRoutes = {
  index: '',
  changelog: 'changelog',
  privacy: 'privacy',
  support: 'support',
  checkout: 'purchase/complete',
  terms: 'purchase-terms',
};

export function pageRoute(page) {
  if (!Object.hasOwn(pageRoutes, page)) throw new Error(`Unknown site page: ${page}`);
  return pageRoutes[page];
}

export function normalizeBasePath(base = '/') {
  const path = String(base || '/').trim();
  if (!path.startsWith('/') || path.startsWith('//') || /[?#]/.test(path)) {
    throw new Error(`Invalid site base path: ${base}`);
  }
  return path.replace(/\/+$/, '');
}

export function assetHref(path, base = '/') {
  const assetPath = String(path).replace(/^\/+/, '');
  if (!assetPath || assetPath.split('/').includes('..')) throw new Error(`Invalid site asset path: ${path}`);
  return `${normalizeBasePath(base)}/${assetPath}`;
}
