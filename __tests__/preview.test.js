const {extractImage, resolveUrl} = require('../src/lib/preview');

test('og:image absoluta y con entidades', () => {
  const html = '<html><head><meta property="og:image" content="https://cdn.x.com/a.jpg?w=1&amp;h=2"></head></html>';
  expect(extractImage(html, 'https://x.com/p')).toBe('https://cdn.x.com/a.jpg?w=1&h=2');
});

test('atributos en otro orden y comillas simples', () => {
  const html = "<meta content='/img/p.png' property='og:image'>";
  expect(extractImage(html, 'https://x.com/a/b')).toBe('https://x.com/img/p.png');
});

test('twitter:image como alternativa y http pasa a https', () => {
  const html = '<meta name="twitter:image" content="http://x.com/t.png">';
  expect(extractImage(html, 'https://x.com')).toBe('https://x.com/t.png');
});

test('sin imagen o con esquema no permitido', () => {
  expect(extractImage('<html></html>', 'https://x.com')).toBeNull();
  expect(extractImage('<meta property="og:image" content="javascript:alert(1)">', 'https://x.com')).toBeNull();
});

test('resolveUrl relativa y protocolo implícito', () => {
  expect(resolveUrl('i.png', 'https://x.com/a/b.html')).toBe('https://x.com/a/i.png');
  expect(resolveUrl('//c.com/i.png', 'https://x.com')).toBe('https://c.com/i.png');
});
