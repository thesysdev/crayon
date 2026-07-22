/**
 * Generates the desktop mega-menu preview art in public/nav.
 *
 *   node scripts/generate-nav-previews.mjs
 *
 * These are vector on purpose: each preview is a few dozen shapes, so SVG is
 * both smaller than an equivalent 2x raster and sharp at any DPR.
 *
 * Composition: a lightly tinted field with the accent blooming from the
 * top-left, and a bordered product surface entering from the bottom-right that
 * runs off both the bottom and right edges. Each scene draws a plausible slice
 * of the thing it links to — real labels, real numbers, one accent affordance —
 * rather than generic placeholder bars, which read as a loading skeleton.
 * Colour is deliberately restrained: a wash in the corner, and exactly one
 * saturated element per scene.
 */
import fs from 'node:fs';

const W = 568, H = 320;
const CARD_X = 216, CARD_Y = 100;   // surface origin; it runs off right + bottom
const R = 20, PAD = 26;
const X = CARD_X + PAD, Y = CARD_Y + PAD;

// Hues behind the site's own pastel tokens, one per menu entry.
const ACCENT = {
  vsjson:    { light: '#7c3aed', dark: '#a78bfa', wash: '#a855f7', washDark: '#c4b5fd' },
  community: { light: '#db2777', dark: '#f472b6', wash: '#e5397f', washDark: '#f9a8d4' },
};

// Real entries from the Lab page, so the preview reads as the actual grid.
const PROJECTS = [
  { name: 'OpenUI Forge', type: 'Tool', accent: '#7c3aed' },
  { name: 'GAIA', type: 'App', accent: '#16a34a' },
  { name: 'Noetic', type: 'Framework', accent: '#d97706' },
  { name: 'Vue Lang', type: 'Framework', accent: '#2563eb' },
];

const T = {
  light: {
    page: '#fbfbfb', card: '#ffffff', border: 'rgba(9,9,9,0.10)',
    rule: 'rgba(9,9,9,0.07)', chip: 'rgba(9,9,9,0.045)',
    ink: 'rgba(9,9,9,0.88)', ink2: 'rgba(9,9,9,0.46)', ink3: 'rgba(9,9,9,0.26)',
    onAccent: '#ffffff', tint: 0.05, bloom: 0.16, bloomR: 78, lift: 0.5, shadow: 0.10,
  },
  dark: {
    page: '#161616', card: '#1f1f1f', border: 'rgba(255,255,255,0.11)',
    rule: 'rgba(255,255,255,0.08)', chip: 'rgba(255,255,255,0.055)',
    ink: 'rgba(255,255,255,0.90)', ink2: 'rgba(255,255,255,0.50)', ink3: 'rgba(255,255,255,0.28)',
    onAccent: '#161616', tint: 0.02, bloom: 0.16, bloomR: 55, lift: 0, shadow: 0.55,
  },
};

const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, ui-sans-serif, sans-serif";
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const r = (x, y, w, h, rx, fill, extra = '') =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}"${extra}/>`;
const t = (x, y, size, weight, fill, str, anchor = 'start') =>
  `<text x="${x}" y="${y}" font-family="${FONT}" font-size="${size}" font-weight="${weight}" ` +
  `fill="${fill}" text-anchor="${anchor}" letter-spacing="-0.2">${esc(str)}</text>`;

function scene(name, c, a) {
  const s = [];
  const box = ` stroke="${c.border}" stroke-width="1"`;

  if (name === 'community') {
    // The Lab project grid, at the density it actually renders on the page.
    s.push(t(X, Y + 10, 12, 600, c.ink, 'Community projects'));
    const CW = 146, CH = 62, G = 10;
    PROJECTS.forEach((p, i) => {
      const cx = X + (i % 2) * (CW + G);
      const cy = Y + 24 + Math.floor(i / 2) * (CH + G);
      s.push(r(cx, cy, CW, CH, 9, 'none', box));
      s.push(r(cx + 11, cy + 11, 17, 17, 5, p.accent));
      s.push(t(cx + 35, cy + 23, 9.5, 550, c.ink, p.name));
      // Type pill
      const pw = 8 + p.type.length * 4.4;
      s.push(r(cx + 11, cy + 35, pw, 12, 6, c.chip));
      s.push(t(cx + 11 + pw / 2, cy + 44, 7.5, 500, c.ink2, p.type, 'middle'));
      s.push(r(cx + 17 + pw, cy + 39, CW - pw - 34, 5, 2.5, c.rule));
    });
  } else {
    // OpenUI vs JSON: the schema on the left, what it renders on the right.
    s.push(r(X, Y + 6, 150, 122, 8, '#101014'));
    ['#ff7979', '#f5c451', '#4ac26b'].forEach((dot, i) =>
      s.push(circle(X + 13 + i * 8, Y + 17, 2.6, dot)));
    const CODE = [
      [['export interface ', '#e6e6e6'], ['HotelCardProps', '#b3a0fd'], [' {', '#e6e6e6']],
      [['  image: {', '#e6e6e6']],
      [['    src: ', '#e6e6e6'], ['string', '#b3a0fd']],
      [['    alt?: ', '#e6e6e6'], ['string', '#b3a0fd']],
      [['  }', '#e6e6e6']],
      [['  badge?: { label: ', '#e6e6e6'], ['string', '#b3a0fd'], [' }', '#e6e6e6']],
      [['  title: ', '#e6e6e6'], ['string', '#b3a0fd']],
      [['  cta: {', '#e6e6e6']],
      [['    label: ', '#e6e6e6'], ['string', '#b3a0fd']],
      [['    onClick?: () => ', '#e6e6e6'], ['void', '#ff7979']],
      [['  }', '#e6e6e6']],
      [['}', '#e6e6e6']],
    ];
    CODE.forEach((line, i) => {
      let dx = 0;
      line.forEach(([txt, fill]) => {
        s.push(`<text x="${X + 13 + dx}" y="${Y + 32 + i * 8}" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="5.4" fill="${fill}" xml:space="preserve">${esc(txt)}</text>`);
        dx += txt.length * 3.15;
      });
    });

    // The card that schema produces.
    s.push(r(X + 162, Y + 14, 110, 106, 7, c.card, box));
    s.push(r(X + 168, Y + 20, 98, 40, 5, '#f0c9c0'));
    s.push(r(X + 168, Y + 65, 34, 11, 3, 'rgba(13,160,94,0.12)'));
    s.push(t(X + 185, Y + 73, 6.5, 500, '#067647', 'Free Wifi', 'middle'));
    s.push(t(X + 168, Y + 87, 7.5, 550, c.ink, 'Hotel Plaza Athenee'));
    s.push(t(X + 168, Y + 96, 6.5, 400, c.ink2, 'Haute couture suites; Dior spa,'));
    s.push(t(X + 168, Y + 104, 6.5, 400, c.ink2, 'near Champs-Elysees.'));
    s.push(r(X + 168, Y + 108, 98, 12, 4, a));
    s.push(t(X + 178, Y + 116, 7, 500, c.onAccent, 'Book'));
  }
  return s.join('');
}

const circle = (cx, cy, rad, fill) => `<circle cx="${cx}" cy="${cy}" r="${rad}" fill="${fill}"/>`;

function svg(name, mode) {
  const c = T[mode];
  const a = ACCENT[name][mode];
  const wash = mode === 'dark' ? ACCENT[name].washDark : ACCENT[name].wash;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="bloom" cx="12%" cy="7%" r="${c.bloomR}%">
      <stop offset="0%" stop-color="${wash}" stop-opacity="${c.bloom}"/>
      <stop offset="100%" stop-color="${wash}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="lift" cx="8%" cy="4%" r="55%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="${c.lift}"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
    <filter id="sh" x="-40%" y="-40%" width="200%" height="200%">
      <feDropShadow dx="-2" dy="6" stdDeviation="16" flood-color="#000" flood-opacity="${c.shadow}"/>
    </filter>
    <clipPath id="frame"><rect x="0" y="0" width="${W}" height="${H}"/></clipPath>
  </defs>
  <g clip-path="url(#frame)">
    <rect width="${W}" height="${H}" fill="${c.page}"/>
    <rect width="${W}" height="${H}" fill="${wash}" opacity="${c.tint}"/>
    <rect width="${W}" height="${H}" fill="url(#bloom)"/>
    <rect width="${W}" height="${H}" fill="url(#lift)"/>
    <g filter="url(#sh)">
      <rect x="${CARD_X}" y="${CARD_Y}" width="${W - CARD_X + 90}" height="${H - CARD_Y + 90}"
            rx="${R}" fill="${c.card}" stroke="${c.border}" stroke-width="1.5"/>
    </g>
    ${scene(name, T[mode], a)}
  </g>
</svg>`;
}

const OUT = new URL('../public/nav/', import.meta.url);
let total = 0;
for (const name of Object.keys(ACCENT)) {
  for (const mode of ['light', 'dark']) {
    const markup = svg(name, mode);
    fs.writeFileSync(new URL(`${name}-${mode}.svg`, OUT), markup);
    total += Buffer.byteLength(markup);
  }
}
console.log(`Wrote ${Object.keys(ACCENT).length * 2} nav previews to public/nav — ${(total / 1024).toFixed(1)} KB total`);
