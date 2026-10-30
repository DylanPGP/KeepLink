const light = {dark: false, danger: '#C62828'};

export const PALETTES = {
  white: {...light, bg: '#FFFFFF', surface: '#F5F5F3', text: '#141414', sub: '#6B6B66', border: '#E4E4E0', primary: '#141414', onPrimary: '#FFFFFF'},
  beige: {...light, bg: '#EAE8E1', surface: '#F3F1EB', text: '#1A1A1A', sub: '#6E6A5F', border: '#D9D6CB', primary: '#1A1A1A', onPrimary: '#EAE8E1'},
  purple: {...light, bg: '#F4EFFB', surface: '#E9DFF6', text: '#1F1530', sub: '#6B5C85', border: '#D6C8EA', primary: '#5B34A6', onPrimary: '#FFFFFF'},
  pink: {...light, bg: '#FCF0F4', surface: '#F8DFE8', text: '#2A1219', sub: '#86596A', border: '#EBC9D6', primary: '#B8325F', onPrimary: '#FFFFFF'},
  dark: {dark: true, danger: '#EF9A9A', bg: '#121212', surface: '#1E1E1E', text: '#EDEDED', sub: '#A3A3A3', border: '#2E2E2E', primary: '#EDEDED', onPrimary: '#121212'},
};

export const THEME_KEYS = ['system', 'beige', 'dark', 'white', 'purple', 'pink'];

export function resolveTheme(pref, scheme) {
  if (PALETTES[pref]) return PALETTES[pref];
  return scheme === 'dark' ? PALETTES.dark : PALETTES.white;
}
