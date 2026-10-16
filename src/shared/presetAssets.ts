export const PRESET_IMAGES = {
  car: 'https://i.pinimg.com/736x/3a/05/61/3a0561586201d3da22447099db0cd9b7.jpg',
  tower: 'https://i.pinimg.com/736x/76/f5/15/76f515553be3926cb6de55f6853786e0.jpg',
  spiderman: 'https://i.pinimg.com/1200x/c8/a3/78/c8a37840b8d3e2f80da52ecd9136fe83.jpg',
  anime: 'https://i.pinimg.com/736x/20/ca/82/20ca82f3fc9f7efc1636225fb4ef21d9.jpg',
};

const petals = Array.from({ length: 8 }, (_, i) => {
  const a = (i * Math.PI) / 4;
  const x = (50 + 17 * Math.cos(a)).toFixed(1);
  const y = (50 + 17 * Math.sin(a)).toFixed(1);
  return `<circle cx="${x}" cy="${y}" r="11" fill="#fff" fill-opacity="0.85" stroke="none"/>`;
}).join('');

export const GLYPH_BODIES: Record<string, string> = {
  messages:
    '<path d="M50 24C34 24 22 34 22 47c0 7 4 13 10 17-1 5-3 9-6 12 7-1 13-4 17-7 2 .5 5 .8 7 .8 16 0 28-10 28-23S66 24 50 24z" fill="#fff" stroke="none"/>',
  safari:
    '<circle cx="50" cy="50" r="30" stroke-width="5"/><polygon points="64,36 55,55 36,64 45,45" fill="#fff" stroke="none"/>',
  music:
    '<path d="M42 66V32l28-6v34" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="36" cy="68" r="8" fill="#fff" stroke="none"/><circle cx="64" cy="62" r="8" fill="#fff" stroke="none"/>',
  mail:
    '<rect x="22" y="30" width="56" height="40" rx="8" stroke-width="5"/><path d="M26 37l24 19 24-19" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>',
  photos: petals,
  notes:
    '<rect x="24" y="22" width="52" height="56" rx="9" stroke-width="5"/><path d="M36 42h28M36 54h28M36 66h16" stroke-width="5" stroke-linecap="round"/>',
  apps:
    '<rect x="26" y="26" width="20" height="20" rx="6" fill="#fff" fill-opacity="0.92" stroke="none"/><rect x="54" y="26" width="20" height="20" rx="6" fill="#fff" fill-opacity="0.92" stroke="none"/><rect x="26" y="54" width="20" height="20" rx="6" fill="#fff" fill-opacity="0.92" stroke="none"/><rect x="54" y="54" width="20" height="20" rx="6" fill="#fff" fill-opacity="0.92" stroke="none"/>',
  spotify:
    '<circle cx="50" cy="50" r="31" fill="#fff" stroke="none"/><path d="M33 42c12-4 25-3 35 3" stroke="#1c1c1e" stroke-width="5.5" stroke-linecap="round"/><path d="M35 53c10-3 20-2 29 3" stroke="#1c1c1e" stroke-width="4.8" stroke-linecap="round"/><path d="M37 63c8-2 16-1 23 2" stroke="#1c1c1e" stroke-width="4" stroke-linecap="round"/>',
  pinterest:
    '<circle cx="50" cy="50" r="31" fill="#fff" stroke="none"/><path d="M46 72l5-21" stroke="#1c1c1e" stroke-width="5" stroke-linecap="round"/><path d="M42 53c-5-10 1-21 11-21 8 0 12 5 12 12 0 9-6 14-12 14-3 0-5-1-6-3" stroke="#1c1c1e" stroke-width="5" stroke-linecap="round" fill="none"/>',
  instagram:
    '<rect x="24" y="24" width="52" height="52" rx="16" stroke-width="5"/><circle cx="50" cy="50" r="12" stroke-width="5"/><circle cx="66" cy="34" r="3.6" fill="#fff" stroke="none"/>',
};

export const glyphSvg = (name: string): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" stroke="#fff">${GLYPH_BODIES[name] || ''}</svg>`;

export const glyphDataUrl = (name: string): string =>
  `data:image/svg+xml;utf8,${encodeURIComponent(glyphSvg(name))}`;
