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
  playground: { light: '#7c3aed', dark: '#a78bfa', wash: '#a855f7', washDark: '#c4b5fd' },
  chat:       { light: '#2563eb', dark: '#60a5fa', wash: '#3b82f6', washDark: '#93c5fd' },
  dashboard:  { light: '#16a34a', dark: '#4ade80', wash: '#22c55e', washDark: '#86efac' },
  openclaw:   { light: '#d97706', dark: '#fbbf24', wash: '#eab308', washDark: '#fcd34d' },
  community:  { light: '#db2777', dark: '#f472b6', wash: '#e5397f', washDark: '#f9a8d4' },
};

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
  if (name === 'playground') {
    s.push(t(X, Y + 11, 13, 600, c.ink, 'Playground'));
    s.push(r(X, Y + 26, 92, 108, 8, c.chip));
    ['Button', 'Card', 'Chart', 'Table'].forEach((label, i) => {
      const yy = Y + 38 + i * 22;
      if (i === 0) s.push(r(X + 6, yy - 9, 80, 18, 5, c.rule));
      s.push(t(X + 14, yy + 3, 10, i === 0 ? 550 : 400, i === 0 ? c.ink : c.ink2, label));
    });
    s.push(r(X + 104, Y + 26, 168, 108, 8, 'none', ` stroke="${c.border}" stroke-width="1"`));
    s.push(t(X + 116, Y + 43, 9, 500, c.ink3, 'PREVIEW'));
    s.push(t(X + 116, Y + 66, 12, 600, c.ink, 'Book a table'));
    s.push(t(X + 116, Y + 82, 9.5, 400, c.ink2, 'Pick a time that suits you'));
    s.push(r(X + 116, Y + 94, 74, 21, 6, a));
    s.push(t(X + 153, Y + 108, 9.5, 550, c.onAccent, 'Reserve', 'middle'));
  } else if (name === 'chat') {
    s.push(r(X + 96, Y, 176, 24, 12, c.chip));
    s.push(t(X + 108, Y + 16, 10, 400, c.ink2, 'How did Q3 revenue land?'));
    s.push(r(X, Y + 36, 250, 100, 9, 'none', ` stroke="${c.border}" stroke-width="1"`));
    s.push(t(X + 14, Y + 56, 12, 600, c.ink, 'Q3 Revenue'));
    s.push(t(X + 14, Y + 78, 17, 600, c.ink, '$48,290'));
    s.push(t(X + 84, Y + 78, 10, 550, a, '+12.4%'));
    const pts = [0, 12, 7, 22, 17, 31, 26, 44];
    s.push(`<polyline points="${pts.map((v, i) => (i % 2 ? Y + 122 - v : X + 14 + (i / 2) * 30)).reduce((acc, v, i) => (i % 2 ? acc + ',' + v : acc + ' ' + v), '')}" fill="none" stroke="${a}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`);
    s.push(t(X + 14, Y + 132, 9, 400, c.ink3, 'Jul        Aug        Sep'));
  } else if (name === 'dashboard') {
    s.push(t(X, Y + 10, 12, 600, c.ink, 'Overview'));
    [['Revenue', '$48.2k'], ['Orders', '1,204'], ['Churn', '2.1%']].forEach(([k, v], i) => {
      const xx = X + i * 92;
      s.push(r(xx, Y + 22, 82, 44, 7, c.chip));
      s.push(t(xx + 11, Y + 39, 9, 400, c.ink2, k));
      s.push(t(xx + 11, Y + 56, 13, 600, c.ink, v));
    });
    const bars = [26, 40, 33, 52, 44, 60];
    bars.forEach((b, i) => s.push(r(X + i * 30, Y + 142 - b, 17, b, 4, i === bars.length - 1 ? a : c.rule)));
    s.push(`<line x1="${X}" y1="${Y + 144}" x2="${X + 260}" y2="${Y + 144}" stroke="${c.rule}" stroke-width="1"/>`);
  } else if (name === 'openclaw') {
    s.push(r(X, Y, 78, 132, 8, c.chip));
    s.push(t(X + 12, Y + 18, 10, 600, c.ink, 'OpenClaw'));
    ['Agents', 'Apps', 'Artifacts', 'Cron'].forEach((label, i) => {
      const yy = Y + 40 + i * 21;
      if (i === 0) s.push(r(X + 6, yy - 10, 66, 19, 5, c.rule));
      s.push(circle(X + 16, yy - 1, 2.6, i === 0 ? a : c.ink3));
      s.push(t(X + 24, yy + 2, 9.5, i === 0 ? 550 : 400, i === 0 ? c.ink : c.ink2, label));
    });
    s.push(t(X + 92, Y + 12, 13, 600, c.ink, 'Good evening'));
    [['Research scout', 'ran 12m ago'], ['Sales follow-up', 'idle']].forEach(([n, m], i) => {
      const yy = Y + 30 + i * 52;
      s.push(r(X + 92, yy, 180, 44, 8, 'none', ` stroke="${c.border}" stroke-width="1"`));
      s.push(r(X + 104, yy + 13, 18, 18, 5, i === 0 ? a : c.rule));
      s.push(t(X + 130, yy + 21, 10, 550, c.ink, n));
      s.push(t(X + 130, yy + 34, 9, 400, c.ink2, m));
    });
  } else {
    s.push(t(X, Y + 10, 12, 600, c.ink, 'Community'));
    [['openui-vue', '1.2k'], ['tanstack-ui', '840'], ['nuxt-openui', '512']].forEach(([n, stars], i) => {
      const yy = Y + 24 + i * 40;
      s.push(r(X, yy, 272, 34, 8, 'none', ` stroke="${c.border}" stroke-width="1"`));
      s.push(r(X + 11, yy + 8, 18, 18, 5, i === 0 ? a : c.rule));
      s.push(t(X + 38, yy + 15, 10, 550, c.ink, n));
      s.push(t(X + 38, yy + 27, 9, 400, c.ink2, 'Renderer + tool bindings'));
      s.push(t(X + 260, yy + 21, 9, 500, c.ink3, '★ ' + stars, 'end'));
    });
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
console.log(`Wrote 10 nav previews to public/nav — ${(total / 1024).toFixed(1)} KB total`);
