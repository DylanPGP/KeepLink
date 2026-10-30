const {STRINGS, resolveLang, fmt} = require('../src/lib/i18n');

test('todos los idiomas tienen las mismas claves y no están vacías', () => {
  const keys = Object.keys(STRINGS.es).sort();
  Object.entries(STRINGS).forEach(([code, dict]) => {
    expect(Object.keys(dict).sort()).toEqual(keys);
    Object.values(dict).forEach(v => expect(typeof v === 'string' && v.length > 0).toBe(true));
  });
});

test('resolveLang y fmt', () => {
  expect(resolveLang('auto', 'pt')).toBe('pt');
  expect(resolveLang('auto', 'de')).toBe('en');
  expect(resolveLang('fr', 'es')).toBe('fr');
  expect(fmt('{n} links', {n: 3})).toBe('3 links');
});
