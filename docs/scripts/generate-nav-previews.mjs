/**
 * Generates the Community projects preview in public/nav.
 *
 *   node scripts/generate-nav-previews.mjs
 *
 * Every other preview is exported straight from the menu design. This one is
 * drawn because the design has no artwork for it — it shows the Lab project
 * grid itself, scaled down and centred so it overflows on every side and reads
 * as a slice of a much larger directory.
 *
 * The frame matches the exported previews exactly, using values read off the
 * design frames rather than eyeballed: fill #f4f4f4 / #1a1a1a, 1px stroke at
 * #000 8% / #2c2c2c, 12px radius — doubled here because the art is authored at
 * 2x. No wash, no gradient, no surface plate behind the cards.
 */
import fs from 'node:fs';

const W = 568, H = 320, R = 24, STROKE = 2;

const THEME = {
  light: {
    surface: '#f4f4f4',
    stroke: 'rgba(0,0,0,0.08)',
    card: '#ffffff',
    cardStroke: 'rgba(0,0,0,0.08)',
    title: 'rgba(9,9,9,0.88)',
    meta: 'rgba(9,9,9,0.32)',
    line: 'rgba(9,9,9,0.06)',
    chip: 'rgba(9,9,9,0.04)',
  },
  dark: {
    surface: '#1a1a1a',
    stroke: '#2c2c2c',
    card: '#212121',
    cardStroke: 'rgba(255,255,255,0.09)',
    title: 'rgba(255,255,255,0.90)',
    meta: 'rgba(255,255,255,0.34)',
    line: 'rgba(255,255,255,0.07)',
    chip: 'rgba(255,255,255,0.05)',
  },
};

// The Lab page's own type -> accent mapping.
const TYPE_ACCENT = {
  Tool: '#7c3aed', Package: '#7c3aed',
  Plugin: '#2563eb', Extension: '#2563eb',
  App: '#16a34a', Provider: '#16a34a',
  Framework: '#d97706',
  Example: '#64748b',
};
const PROJECTS = [
  ['OpenUI Forge', 'Tool'], ['GAIA', 'App'], ['Noetic', 'Framework'], ['Field Theory UI', 'App'],
  ['Open WebUI Plugin', 'Plugin'], ['Ollama Integration', 'Provider'], ['Genui VS Code', 'Extension'],
  ['OpenClaw OS Plugin', 'Plugin'], ['OpenUI Plotly', 'Package'], ['Vue Lang', 'Framework'],
  ['Svelte Lang', 'Framework'], ['React Native', 'Example'],
].map(([name, type]) => ({ name, type, accent: TYPE_ACCENT[type] }));

const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, ui-sans-serif, sans-serif";
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const r = (x, y, w, h, rx, fill, extra = '') =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}"${extra}/>`;
const t = (x, y, size, weight, fill, str, anchor = 'start') =>
  `<text x="${x}" y="${y}" font-family="${FONT}" font-size="${size}" font-weight="${weight}" ` +
  `fill="${fill}" text-anchor="${anchor}" letter-spacing="-0.2">${esc(str)}</text>`;

function svg(mode) {
  const c = THEME[mode];
  const CW = 150, CH = 108, G = 12, COLS = 4, ROWS = 3;
  // Centre the block so it overflows evenly rather than hanging off one corner.
  const X0 = Math.round((W - (COLS * CW + (COLS - 1) * G)) / 2);
  const Y0 = Math.round((H - (ROWS * CH + (ROWS - 1) * G)) / 2);

  const cards = PROJECTS.map((p, i) => {
    const x = X0 + (i % COLS) * (CW + G);
    const y = Y0 + Math.floor(i / COLS) * (CH + G);
    const pw = 11 + p.type.length * 4.7;
    return [
      r(x, y, CW, CH, 10, c.card, ` stroke="${c.cardStroke}" stroke-width="1"`),
      t(x + 14, y + 26, 10.5, 550, c.title, p.name),
      r(x + 14, y + 34, pw, 14, 5, p.accent, ' opacity="0.14"'),
      t(x + 14 + pw / 2, y + 44, 7.5, 500, p.accent, p.type, 'middle'),
      t(x + 21 + pw, y + 44, 7.5, 400, c.meta, 'by Community'),
      [CW - 28, CW - 28, CW - 52].map((lw, k) => r(x + 14, y + 58 + k * 10, lw, 5, 2.5, c.line)).join(''),
      r(x + 14, y + 88, 42, 11, 5.5, c.chip),
      r(x + 62, y + 88, 42, 11, 5.5, c.chip),
    ].join('');
  }).join('');

  // Inset the stroke by half its weight so it isn't clipped at the frame edge.
  const inset = STROKE / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs><clipPath id="frame"><rect x="0" y="0" width="${W}" height="${H}" rx="${R}"/></clipPath></defs>
  <g clip-path="url(#frame)">
    <rect width="${W}" height="${H}" fill="${c.surface}"/>
    ${cards}
  </g>
  <rect x="${inset}" y="${inset}" width="${W - STROKE}" height="${H - STROKE}" rx="${R - inset}"
        fill="none" stroke="${c.stroke}" stroke-width="${STROKE}"/>
</svg>`;
}

const OUT = new URL('../public/nav/', import.meta.url);
for (const mode of ['light', 'dark']) {
  const markup = svg(mode);
  fs.writeFileSync(new URL(`community-${mode}.svg`, OUT), markup);
  console.log(`  community-${mode}.svg  ${(Buffer.byteLength(markup) / 1024).toFixed(1)} KB`);
}
