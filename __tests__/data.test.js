const {
  normalizeUrl, urlKey, buildExport, toCsv, parseImport, mergeImport, parseCsv,
} = require('../src/lib/data');

const base = () => ({
  collections: [{id: 'c1', name: 'Trabajo', emoji: '💼', createdAt: 1}],
  links: [
    {id: 'l1', url: 'https://example.com/a', title: 'A, "uno"', note: 'línea1\nlínea2', collectionId: 'c1', favorite: true, read: false, createdAt: 10},
  ],
});

test('normalizeUrl', () => {
  expect(normalizeUrl('example.com')).toBe('https://example.com');
  expect(normalizeUrl('HTTP://Example.COM/Path')).toBe('http://example.com/Path');
  expect(normalizeUrl('javascript:alert(1)')).toBeNull();
  expect(normalizeUrl('mailto:x@a.com')).toBeNull();
  expect(normalizeUrl('foo bar')).toBeNull();
  expect(normalizeUrl('')).toBeNull();
});

test('urlKey ignora barra final y fragmento', () => {
  expect(urlKey('https://a.com/')).toBe(urlKey('a.com#x'));
});

test('JSON export/import round trip sin duplicados', () => {
  const d = base();
  const text = JSON.stringify(buildExport(d));
  const r = mergeImport({links: [], collections: []}, parseImport(text));
  expect(r.added).toBe(1);
  expect(r.data.collections.map(c => c.name)).toEqual(['Trabajo']);
  expect(r.data.collections[0].emoji).toBe('💼');
  expect(r.data.links[0].title).toBe('A, "uno"');
  const again = mergeImport(r.data, parseImport(text));
  expect(again.added).toBe(0);
  expect(again.duplicates).toBe(1);
  expect(again.data.links.length).toBe(1);
});

test('CSV export/import round trip', () => {
  const csv = toCsv(base());
  const r = mergeImport({links: [], collections: []}, parseImport(csv));
  expect(r.added).toBe(1);
  expect(r.data.links[0].note).toBe('línea1\nlínea2');
  expect(r.data.links[0].favorite).toBe(true);
  expect(r.data.links[0].collectionId).toBe(r.data.collections[0].id);
});

test('importar no modifica datos existentes y cuenta inválidos', () => {
  const d = base();
  const snapshot = JSON.stringify(d);
  const parsed = parseImport(JSON.stringify([{url: 'nota valida'}, {url: 'https://b.com', title: 'B'}, 'c.com']));
  const r = mergeImport(d, parsed);
  expect(JSON.stringify(d)).toBe(snapshot);
  expect(r.invalid).toBe(1);
  expect(r.added).toBe(2);
  expect(r.data.links.slice(0, 1)).toEqual(d.links);
});

test('archivos no compatibles lanzan error', () => {
  expect(() => parseImport('')).toThrow();
  expect(() => parseImport('{"x":1}')).toThrow();
  expect(() => parseImport('{roto')).toThrow();
  expect(() => parseImport('a,b\n1,2')).toThrow();
});

test('parseCsv con comillas y saltos', () => {
  expect(parseCsv('a,"b ""c""",d\r\n1,2,3\r\n')).toEqual([['a', 'b "c"', 'd'], ['1', '2', '3']]);
});
