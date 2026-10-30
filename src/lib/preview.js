const UA =
  'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36';
const KEYS = ['og:image', 'og:image:secure_url', 'twitter:image', 'twitter:image:src'];

const decode = s =>
  s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&#x2F;/g, '/');

function attrs(tag) {
  const out = {};
  const re = /([a-zA-Z:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
  let m;
  while ((m = re.exec(tag))) out[m[1].toLowerCase()] = m[2] !== undefined ? m[2] : m[3];
  return out;
}

export function resolveUrl(src, base) {
  const s = decode(src.trim());
  const b = String(base).match(/^(https?:)\/\/([^/?#]+)([^?#]*)/i);
  if (!s || !b || (/^[a-z][a-z0-9+.-]*:/i.test(s) && !/^https?:/i.test(s))) return null;
  let abs;
  if (/^https?:\/\//i.test(s)) abs = s;
  else if (s.startsWith('//')) abs = b[1] + s;
  else if (s.startsWith('/')) abs = b[1] + '//' + b[2] + s;
  else abs = b[1] + '//' + b[2] + b[3].replace(/[^/]*$/, '') + s;
  abs = abs.replace(/^http:/i, 'https:');
  return /^https:\/\/[^\s]+$/i.test(abs) && abs.length < 2000 ? abs : null;
}

export function extractImage(html, baseUrl) {
  const found = {};
  const tags = String(html).match(/<meta\s[^>]*>/gi) || [];
  for (const tag of tags) {
    const a = attrs(tag);
    const key = (a.property || a.name || '').toLowerCase();
    if (KEYS.includes(key) && a.content && !found[key]) found[key] = a.content;
  }
  for (const k of KEYS) {
    if (found[k]) {
      const u = resolveUrl(found[k], baseUrl);
      if (u) return u;
    }
  }
  return null;
}

export async function fetchPreview(url, timeoutMs = 8000) {
  const target = url.replace(/^http:/i, 'https:');
  const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = ctrl ? setTimeout(() => ctrl.abort(), timeoutMs) : null;
  try {
    const res = await fetch(target, {
      signal: ctrl ? ctrl.signal : undefined,
      headers: {Accept: 'text/html', 'User-Agent': UA},
    });
    const type = (res.headers && res.headers.get('content-type')) || '';
    if (!res.ok || !/html/i.test(type)) return null;
    const html = (await res.text()).slice(0, 400000);
    return extractImage(html, res.url || target);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
