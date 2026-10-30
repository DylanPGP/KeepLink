export const newId = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

export function normalizeUrl(raw) {
  if (typeof raw !== 'string') return null;
  let s = raw.trim();
  if (!s || /\s/.test(s)) return null;
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(s)) {
    if (!/^[^./]+(\.[^./]+)+/.test(s)) return null;
    s = 'https://' + s;
  }
  const m = s.match(/^(https?):\/\/([^/?#]+)(.*)$/i);
  if (!m) return null;
  if (!/^[a-z0-9-]+(\.[a-z0-9-]+)*(:\d+)?$/i.test(m[2])) return null;
  return m[1].toLowerCase() + '://' + m[2].toLowerCase() + m[3];
}

export function urlKey(url) {
  const n = normalizeUrl(url);
  return n ? n.replace(/#.*$/, '').replace(/\/+$/, '') : null;
}

export function hostOf(url) {
  const m = String(url).match(/^https?:\/\/([^/?#:]+)/i);
  return m ? m[1].replace(/^www\./, '') : String(url);
}

export function buildExport(data, now = new Date()) {
  const names = new Map(data.collections.map(c => [c.id, c.name]));
  return {
    app: 'KeepLink',
    version: 1,
    exportedAt: now.toISOString(),
    collections: data.collections.map(c => ({name: c.name, emoji: c.emoji || null})),
    links: data.links.map(l => ({
      url: l.url,
      title: l.title,
      note: l.note,
      collection: names.get(l.collectionId) || null,
      favorite: !!l.favorite,
      read: !!l.read,
      createdAt: l.createdAt,
    })),
  };
}

const csvCell = v => {
  const s = String(v == null ? '' : v);
  return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
};

export function toCsv(data) {
  const e = buildExport(data);
  const rows = [['url', 'title', 'note', 'collection', 'favorite', 'read', 'createdAt']];
  e.links.forEach(l =>
    rows.push([l.url, l.title, l.note, l.collection || '', l.favorite, l.read, l.createdAt]),
  );
  return '\uFEFF' + rows.map(r => r.map(csvCell).join(',')).join('\r\n') + '\r\n';
}

export function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else q = false;
      } else cell += ch;
    } else if (ch === '"') q = true;
    else if (ch === ',') {
      row.push(cell);
      cell = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else cell += ch;
  }
  if (cell !== '' || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

export function parseImport(text) {
  const raw = String(text || '').replace(/^\uFEFF/, '').trim();
  if (!raw) throw new Error('empty');
  if (raw[0] === '{' || raw[0] === '[') {
    let j;
    try {
      j = JSON.parse(raw);
    } catch (e) {
      throw new Error('format');
    }
    const isArr = Array.isArray(j);
    const links = isArr ? j : j && j.app === 'KeepLink' && Array.isArray(j.links) ? j.links : null;
    if (!links) throw new Error('format');
    const collections = !isArr && Array.isArray(j.collections) ? j.collections : [];
    return {
      collections: collections
        .map(x => (typeof x === 'string' ? {name: x} : x && typeof x.name === 'string' ? {name: x.name, emoji: x.emoji} : null))
        .filter(Boolean),
      links,
    };
  }
  const rows = parseCsv(raw);
  const head = (rows[0] || []).map(h => h.trim().toLowerCase());
  if (!head.includes('url')) throw new Error('format');
  const links = rows
    .slice(1)
    .filter(r => r.some(x => x.trim()))
    .map(r => Object.fromEntries(head.map((h, i) => [h, r[i]])));
  return {collections: [], links};
}

export const cleanEmoji = v => (typeof v === 'string' && v.trim() && v.trim().length <= 8 ? v.trim() : null);

const toBool = v => v === true || v === 1 || v === 'true' || v === '1';

export function mergeImport(data, parsed, now = Date.now()) {
  const collections = [...data.collections];
  const byName = new Map(collections.map(c => [c.name.toLowerCase(), c.id]));
  const ensure = (name, emoji) => {
    const n = String(name == null ? '' : name).trim().slice(0, 60);
    if (!n) return null;
    const k = n.toLowerCase();
    if (!byName.has(k)) {
      const id = newId();
      collections.push({id, name: n, emoji: cleanEmoji(emoji), createdAt: now});
      byName.set(k, id);
    }
    return byName.get(k);
  };
  parsed.collections.forEach(c => ensure(c.name, c.emoji));
  const keys = new Set(data.links.map(l => urlKey(l.url)));
  const links = [...data.links];
  let added = 0;
  let duplicates = 0;
  let invalid = 0;
  for (const it of parsed.links) {
    const o = typeof it === 'string' ? {url: it} : it;
    const url = o && typeof o === 'object' ? normalizeUrl(o.url) : null;
    if (!url) {
      invalid++;
      continue;
    }
    const k = urlKey(url);
    if (keys.has(k)) {
      duplicates++;
      continue;
    }
    keys.add(k);
    const created = Number(o.createdAt);
    links.push({
      id: newId(),
      url,
      title: String(o.title || '').trim().slice(0, 200) || hostOf(url),
      note: String(o.note || '').trim().slice(0, 2000),
      collectionId: ensure(o.collection),
      favorite: toBool(o.favorite),
      read: toBool(o.read),
      createdAt: Number.isFinite(created) && created > 0 ? created : now,
    });
    added++;
  }
  return {data: {links, collections}, added, duplicates, invalid};
}

export function sanitizeData(p) {
  const collections = Array.isArray(p && p.collections)
    ? p.collections
        .filter(c => c && typeof c.id === 'string' && typeof c.name === 'string')
        .map(c => ({id: c.id, name: c.name, emoji: cleanEmoji(c.emoji), createdAt: Number(c.createdAt) || Date.now()}))
    : [];
  const ids = new Set(collections.map(c => c.id));
  const links = Array.isArray(p && p.links)
    ? p.links
        .filter(l => l && typeof l.id === 'string' && typeof l.url === 'string')
        .map(l => ({
          id: l.id,
          url: l.url,
          title: String(l.title || ''),
          note: String(l.note || ''),
          collectionId: ids.has(l.collectionId) ? l.collectionId : null,
          favorite: !!l.favorite,
          read: !!l.read,
          image: typeof l.image === 'string' && /^https:\/\//i.test(l.image) ? l.image : null,
          previewTried: !!l.previewTried,
          createdAt: Number(l.createdAt) || Date.now(),
        }))
    : [];
  return {links, collections};
}
