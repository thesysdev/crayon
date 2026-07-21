/**
 * Generates the desktop mega-menu preview art in public/nav.
 *
 *   node scripts/generate-nav-previews.mjs
 *
 * These are vector on purpose: each preview is a few dozen shapes, so SVG is
 * both smaller than an equivalent 2x raster and sharp at any DPR.
 *
 * Composition: a soft pastel field with the accent blooming from the top-left,
 * and a bordered UI card entering from the bottom-right that runs off both the
 * bottom and right edges. Colours are the hues behind the site's own pastel
 * tokens (info / success / alert / purple / pink backgrounds), one per menu
 * entry. The mock UI is deliberately abstract — at 284x160 real text is
 * illegible, so shapes read cleaner than fake copy.
 */
import fs from 'node:fs';

const W = 568, H = 320;           // 2x the 284x160 slot
const CARD_X = 238, CARD_Y = 110; // card origin; it runs off the right + bottom
const R = 22;                     // card corner radius
const PAD = 30;

// Accent hexes matching the site's own pastel tokens (info / success / alert /
// purple / pink backgrounds in @openuidev/react-ui).
const ACCENT = {
  playground: '#a855f7', // purple  — code + compare
  chat:       '#3b82f6', // info    — conversation
  dashboard:  '#22c55e', // success — metrics
  openclaw:   '#eab308', // alert   — workspace
  community:  '#e5397f', // pink    — community
};

// Dark mode can't reuse the light accents: a saturated hue laid over near-black
// reads as a dirty dark version of itself, not a pastel. These are the same hues
// pre-mixed toward white so the glow stays soft.
const ACCENT_SOFT = {
  playground: '#d3aafb',
  chat:       '#9dc0fa',
  dashboard:  '#90e2ae',
  openclaw:   '#f4d983',
  community:  '#f29cbf',
};

const T = {
  light: {
    page: '#fafafa', card: '#ffffff', border: 'rgba(9,9,9,0.09)',
    ink: 'rgba(9,9,9,0.13)', inkSoft: 'rgba(9,9,9,0.07)',
    // Flat wash + a soft accent bloom in the corner the card leaves empty.
    tint: 0.13, bloom: 0.30, bloomR: 85, lift: 0.55, accentOnCard: 0.9, shadow: 0.10,
  },
  dark: {
    page: '#161616', card: '#212121', border: 'rgba(255,255,255,0.10)',
    ink: 'rgba(255,255,255,0.16)', inkSoft: 'rgba(255,255,255,0.08)',
    // A flat tint this dark goes muddy, so most of the colour comes from the
    // bloom and the base stays near-black.
    tint: 0.02, bloom: 0.34, bloomR: 52, lift: 0, accentOnCard: 0.85, shadow: 0.55,
  },
};

const r = (x, y, w, h, rx, fill) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}"/>`;
const circle = (cx, cy, rad, fill) => `<circle cx="${cx}" cy="${cy}" r="${rad}" fill="${fill}"/>`;

// Each scene draws only into the card's visible top-left wedge.
function scene(name, t, rawAccent) {
  const accent = rawAccent;
  const x = CARD_X + PAD, y = CARD_Y + PAD;
  const s = [];
  if (name === 'playground') {
    // Left rail of blocks + a preview surface.
    for (let i = 0; i < 3; i++) s.push(r(x, y + i * 30, 46, 20, 6, i === 0 ? accent : t.ink));
    s.push(r(x + 60, y, 150, 80, 10, t.inkSoft));
    s.push(r(x + 74, y + 16, 74, 8, 4, t.ink));
    s.push(r(x + 74, y + 32, 108, 8, 4, t.inkSoft));
    s.push(r(x + 74, y + 48, 92, 8, 4, t.inkSoft));
  } else if (name === 'chat') {
    // Two bubbles, the reply tinted with the accent.
    s.push(r(x, y, 132, 26, 13, t.ink));
    s.push(r(x, y + 38, 176, 40, 14, t.inkSoft));
    s.push(r(x + 40, y + 92, 148, 26, 13, accent));
  } else if (name === 'dashboard') {
    // Stat row over a small bar chart.
    for (let i = 0; i < 3; i++) s.push(r(x + i * 68, y, 56, 30, 8, t.inkSoft));
    const bars = [30, 48, 38, 62, 52];
    bars.forEach((b, i) => s.push(r(x + i * 34, y + 118 - b, 20, b, 5, i === 3 ? accent : t.ink)));
  } else if (name === 'openclaw') {
    // Sidebar rail + two workspace cards.
    s.push(r(x, y, 44, 122, 10, t.inkSoft));
    for (let i = 0; i < 3; i++) s.push(circle(x + 22, y + 20 + i * 26, 5, i === 0 ? accent : t.ink));
    s.push(r(x + 58, y, 152, 54, 10, t.inkSoft));
    s.push(r(x + 58, y + 66, 152, 54, 10, t.inkSoft));
    s.push(r(x + 72, y + 16, 68, 8, 4, t.ink));
    s.push(r(x + 72, y + 82, 88, 8, 4, t.ink));
  } else {
    // community — a grid of tiles, one picked out in the accent.
    for (let i = 0; i < 4; i++) {
      const cx = x + (i % 2) * 84, cy = y + Math.floor(i / 2) * 66;
      s.push(r(cx, cy, 70, 52, 10, i === 1 ? accent : t.inkSoft));
      if (i !== 1) s.push(r(cx + 12, cy + 14, 34, 7, 3, t.ink));
    }
  }
  return s.join('');
}

function svg(name, mode) {
  const t = T[mode], a = ACCENT[name];
  // The wash uses the softened hue in dark mode; card elements keep the true one.
  const wash = mode === 'dark' ? ACCENT_SOFT[name] : a;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="bloom" cx="12%" cy="7%" r="${t.bloomR}%">
      <stop offset="0%" stop-color="${wash}" stop-opacity="${t.bloom}"/>
      <stop offset="100%" stop-color="${wash}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="lift" cx="8%" cy="4%" r="60%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="${t.lift}"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
    <filter id="sh" x="-40%" y="-40%" width="200%" height="200%">
      <feDropShadow dx="-2" dy="6" stdDeviation="16" flood-color="#000" flood-opacity="${t.shadow}"/>
    </filter>
    <clipPath id="frame"><rect x="0" y="0" width="${W}" height="${H}"/></clipPath>
  </defs>
  <g clip-path="url(#frame)">
    <rect width="${W}" height="${H}" fill="${t.page}"/>
    <rect width="${W}" height="${H}" fill="${wash}" opacity="${t.tint}"/>
    <rect width="${W}" height="${H}" fill="url(#bloom)"/>
    <rect width="${W}" height="${H}" fill="url(#lift)"/>
    <g filter="url(#sh)">
      <rect x="${CARD_X}" y="${CARD_Y}" width="${W - CARD_X + 90}" height="${H - CARD_Y + 90}"
            rx="${R}" fill="${t.card}" stroke="${t.border}" stroke-width="1.5"/>
    </g>
    ${scene(name, t, a)}
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
