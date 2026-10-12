// Landmark icons in the clean style chosen in the place icons thread: plain geometric SVG on a
// 100-unit grid, even black strokes, and one signature detail per place filled in its colour.
// Every shape is built straight from its coordinates: straight runs are lines, curves are real
// arc (A) or quadratic commands. Static, so every render draws the same icon.

type Pt = [number, number];

const n = (v: number) => +v.toFixed(2);

// Each helper returns SVG path data.
const line = (x1: number, y1: number, x2: number, y2: number) => `M${n(x1)} ${n(y1)}L${n(x2)} ${n(y2)}`;
const poly = (pts: Pt[]) => `M${pts.map(([x, y]) => `${n(x)} ${n(y)}`).join("L")}`;
const closed = (pts: Pt[]) => `${poly(pts)}Z`;

/** Elliptical arc from angle a0 to a1 (radians, increasing angle runs clockwise on screen). */
function arc(cx: number, cy: number, rx: number, ry: number, a0: number, a1: number) {
  const [x0, y0] = [cx + rx * Math.cos(a0), cy + ry * Math.sin(a0)];
  const [x1, y1] = [cx + rx * Math.cos(a1), cy + ry * Math.sin(a1)];
  const large = Math.abs(a1 - a0) > Math.PI ? 1 : 0;
  return `M${n(x0)} ${n(y0)}A${n(rx)} ${n(ry)} 0 ${large} 1 ${n(x1)} ${n(y1)}`;
}

const circle = (cx: number, cy: number, r: number) =>
  `M${n(cx - r)} ${n(cy)}A${r} ${r} 0 1 1 ${n(cx + r)} ${n(cy)}A${r} ${r} 0 1 1 ${n(cx - r)} ${n(cy)}Z`;

/** Water: a sine wave of half-period quadratic curves, starting upward. */
function wave(x1: number, x2: number, y: number, amp = 2.2, per = 10) {
  let d = `M${n(x1)} ${n(y)}`;
  for (let x = x1, up = true; x < x2 - 0.01; x += per / 2, up = !up) {
    const end = Math.min(x + per / 2, x2);
    d += `Q${n((x + end) / 2)} ${n(y + (up ? -2 : 2) * amp)} ${n(end)} ${n(y)}`;
  }
  return d;
}

const U = Math.PI; // arcs from U to 2U run over the top

const rect = (x1: number, y1: number, x2: number, y2: number) =>
  closed([[x1, y1], [x2, y1], [x2, y2], [x1, y2]]);

/** An arched opening: legs from base up to top, then a half circle over them. Add "Z" to fill it. */
const arch = (cx: number, w: number, top: number, base: number) =>
  `M${n(cx - w)} ${n(base)}L${n(cx - w)} ${n(top)}A${n(w)} ${n(w)} 0 0 1 ${n(cx + w)} ${n(top)}L${n(cx + w)} ${n(base)}`;

/** Points turned clockwise on screen by deg around (ox, oy). */
function tilt(pts: Pt[], deg: number, ox: number, oy: number): Pt[] {
  const [c, s] = [Math.cos((deg * U) / 180), Math.sin((deg * U) / 180)];
  return pts.map(([x, y]) => [ox + (x - ox) * c - (y - oy) * s, oy + (x - ox) * s + (y - oy) * c]);
}

/** A tall spire: straight sides from base to shoulder, then curving in to a point at top. */
const spire = (cx: number, w: number, top: number, shoulder: number, base: number) => {
  const k = n(top + (shoulder - top) * 0.4);
  return `M${n(cx - w)} ${n(base)}L${n(cx - w)} ${n(shoulder)}Q${n(cx - w)} ${k} ${n(cx)} ${n(top)}Q${n(cx + w)} ${k} ${n(cx + w)} ${n(shoulder)}L${n(cx + w)} ${n(base)}`;
};

/** An onion dome on a base of half width w at y, swelling out and rising h to a point. */
const onion = (cx: number, y: number, w: number, h: number) =>
  `M${n(cx - w)} ${n(y)}C${n(cx - w * 1.9)} ${n(y - h * 0.45)} ${n(cx - w * 0.3)} ${n(y - h * 0.7)} ${n(cx)} ${n(y - h)}` +
  `C${n(cx + w * 0.3)} ${n(y - h * 0.7)} ${n(cx + w * 1.9)} ${n(y - h * 0.45)} ${n(cx + w)} ${n(y)}Z`;

/** A leaf from (x1, y1) to its tip (x2, y2), bowed b units to the left of that direction. */
function leaf(x1: number, y1: number, x2: number, y2: number, b: number) {
  const [mx, my, len] = [(x1 + x2) / 2, (y1 + y2) / 2, Math.hypot(x2 - x1, y2 - y1)];
  const [px, py] = [((y2 - y1) / len) * b, (-(x2 - x1) / len) * b];
  return `M${n(x1)} ${n(y1)}Q${n(mx + px)} ${n(my + py)} ${n(x2)} ${n(y2)}Q${n(mx + px * 0.2)} ${n(my + py * 0.2)} ${n(x1)} ${n(y1)}Z`;
}

/** An East Asian roof: eaves of half width w at y that flick up at the ends, rising h to the ridge. */
const roof = (cx: number, y: number, w: number, h: number) =>
  `M${n(cx - w)} ${n(y - 4)}Q${n(cx - w * 0.6)} ${n(y + 1)} ${n(cx)} ${n(y + 1)}Q${n(cx + w * 0.6)} ${n(y + 1)} ${n(cx + w)} ${n(y - 4)}` +
  `L${n(cx + w * 0.62)} ${n(y - h)}L${n(cx - w * 0.62)} ${n(y - h)}Z`;

type Place = {
  name: string;
  /** The place's one colour, used for every fill in its icon. */
  color: string;
  fills: string[];
  strokes: string[];
};

const aurora = "M12 32Q31 14 50 26Q69 38 88 20L88 28Q69 46 50 34Q31 22 12 40Z";
const gondola = "M14 52Q24 70 50 70Q76 70 86 48L80 60L22 62Z";
const pisa = (pts: Pt[]) => tilt(pts, 6, 50, 86);
const colosseum = [21.2, 35.6, 50, 64.4, 78.8];
const sagrada: Pt[] = [[26, 32], [41, 14], [59, 14], [74, 32]];
const tram = [rect(18, 44, 82, 74), rect(25, 50, 37, 60), rect(44, 50, 56, 60), rect(63, 50, 75, 60)];

const hawa = [
  closed([[18, 86], [18, 56], [26, 56], [26, 42], [34, 42], [34, 30], [42, 30], [42, 20], [58, 20], [58, 30], [66, 30], [66, 42], [74, 42], [74, 56], [82, 56], [82, 86]]),
  ...[28, 39, 50, 61, 72].map((x) => `${arch(x, 3, 68, 78)}Z`),
  ...[36, 50, 64].map((x) => `${arch(x, 3, 48, 53)}Z`),
  `${arch(50, 3, 35, 40)}Z`,
];
const fronds = [leaf(56, 30, 84, 34, 7), leaf(56, 30, 78, 50, 6), leaf(56, 30, 30, 28, -7), leaf(56, 30, 36, 46, -6), leaf(56, 30, 60, 10, 6)];
const lagoon = `${wave(10, 90, 76)}L90 86L10 86Z`;
const heaven = [roof(50, 62, 30, 8), roof(50, 46, 22, 7), roof(50, 32, 14, 6)];
const junkSails = [closed([[38, 58], [38, 14], [60, 20], [62, 58]]), closed([[66, 56], [66, 28], [82, 34], [82, 56]])];
const fuji: Pt[] = [[10, 86], [38, 34], [44, 30], [56, 30], [62, 34], [90, 86]];
const fujiSnow: Pt[] = [[34.2, 41], [38, 34], [44, 30], [56, 30], [62, 34], [65.8, 41], [60, 46], [55, 40], [50, 47], [45, 40], [40, 46]];
const angkorTowers: [number, number, number, number, number][] = [[50, 7, 12, 32, 56], [34, 6, 24, 40, 56], [66, 6, 24, 40, 56], [18, 5, 36, 50, 62], [82, 5, 36, 50, 62]];
const angkor = angkorTowers.map((t) => spire(...t));
const angkorTiers = angkorTowers.flatMap(([x, w, , s, b]) => [line(x - w, s, x + w, s), line(x - w, (s + b) / 2, x + w, (s + b) / 2)]);
const petronas = (cx: number): Pt[] => [
  [cx - 8, 86], [cx - 8, 54], [cx - 6.5, 54], [cx - 6.5, 40], [cx - 5, 40], [cx - 5, 30], [cx - 3, 30], [cx - 3, 22], [cx, 8],
  [cx + 3, 22], [cx + 3, 30], [cx + 5, 30], [cx + 5, 40], [cx + 6.5, 40], [cx + 6.5, 54], [cx + 8, 54], [cx + 8, 86],
];
const skypark = closed([[12, 26], [88, 22], [86, 30], [14, 32]]);
const candi: Pt[] = [[16, 86], [16, 66], [20, 66], [20, 54], [25, 54], [25, 42], [30, 42], [30, 30], [35, 30], [35, 20], [40, 20], [40, 12], [44, 12], [44, 86]];
const mirror = (pts: Pt[]): Pt[] => pts.map(([x, y]) => [100 - x, y]);
const surfboard = "M72 18Q82 50 72 84Q62 50 72 18Z";
const liberty = closed([[40, 62], [42, 36], [50, 32], [58, 36], [60, 62]]);
const needleTop = closed([[28, 34], [38, 26], [62, 26], [72, 34], [62, 38], [38, 38]]);
const cnPod = closed([[36, 40], [40, 34], [60, 34], [64, 40], [60, 46], [40, 46]]);
const star = (cx: number, cy: number, r: number) =>
  closed(Array.from({ length: 10 }, (_, i): Pt => {
    const [a, k] = [-U / 2 + (i * U) / 5, i % 2 ? 0.45 : 1];
    return [cx + r * k * Math.cos(a), cy + r * k * Math.sin(a)];
  }));
const vegas = closed([[12, 40], [50, 22], [88, 40], [50, 58]]);
const chichen = closed([[42, 34], [58, 34], [58, 46], [42, 46]]);
const huayna = closed([[30, 86], [42, 52], [50, 30], [58, 24], [66, 32], [72, 52], [82, 86]]);
const corcovado = closed([[10, 86], [30, 66], [42, 58], [58, 58], [70, 66], [90, 86]]);

// Ordered by region: Europe, Middle East and Africa, South Asia, East and Southeast Asia,
// Oceania and the Pacific, then the Americas.
export const places: Place[] = [
  // Europe
  {
    name: "Iceland",
    color: "#22A65A", // leaf aurora
    fills: [aurora],
    strokes: [
      aurora,
      poly([[10, 86], [32, 58], [42, 66], [60, 48], [90, 86]]),
      poly([[53, 55], [57, 59], [60, 55], [63, 59], [67, 57]]),
      line(10, 86, 90, 86),
    ],
  },
  {
    name: "London",
    color: "#5BC0FF", // sky clock face
    fills: [circle(50, 31, 6.5)],
    strokes: [
      poly([[42, 86], [42, 40], [58, 40], [58, 86]]),
      rect(38, 22, 62, 40),
      circle(50, 31, 6.5),
      poly([[38, 22], [50, 6], [62, 22]]),
      line(50, 50, 50, 76),
      line(10, 86, 90, 86),
    ],
  },
  {
    name: "Amsterdam",
    color: "#FF5364", // coral stepped-gable house
    fills: [closed([[38, 78], [38, 34], [42, 34], [42, 28], [46, 28], [46, 22], [50, 22], [50, 28], [54, 28], [54, 34], [58, 34], [58, 78]])],
    strokes: [
      poly([[22, 78], [22, 44], [30, 34], [38, 44]]),
      closed([[38, 78], [38, 34], [42, 34], [42, 28], [46, 28], [46, 22], [50, 22], [50, 28], [54, 28], [54, 34], [58, 34], [58, 78]]),
      poly([[58, 46], [64, 46], [64, 38], [72, 38], [72, 46], [78, 46], [78, 78]]),
      line(14, 78, 86, 78),
      wave(14, 86, 87),
    ],
  },
  {
    name: "Paris",
    color: "#FFB020", // saffron sun
    fills: [circle(80, 22, 8)],
    strokes: [
      poly([[27, 86], [35, 68], [41, 50], [45, 32], [47, 20], [50, 8]]),
      poly([[73, 86], [65, 68], [59, 50], [55, 32], [53, 20], [50, 8]]),
      line(31, 68, 69, 68),
      line(38, 50, 62, 50),
      line(43, 32, 57, 32),
      arc(50, 86, 11, 13, U, 2 * U),
      line(10, 86, 90, 86),
    ],
  },
  {
    name: "Berlin",
    color: "#22A65A", // leaf quadriga
    fills: [closed([[44, 32], [46, 24], [54, 24], [56, 32]])],
    strokes: [
      rect(18, 40, 82, 48),
      poly([[38, 40], [38, 32], [62, 32], [62, 40]]),
      closed([[44, 32], [46, 24], [54, 24], [56, 32]]),
      ...[22, 33, 44, 56, 67, 78].map((x) => line(x, 48, x, 86)),
      line(10, 86, 90, 86),
    ],
  },
  {
    name: "Prague",
    color: "#2F5BFF", // cobalt spires
    fills: [closed([[30, 40], [36, 12], [42, 40]]), closed([[58, 40], [64, 12], [70, 40]])],
    strokes: [
      poly([[30, 86], [30, 40], [42, 40], [42, 86]]),
      closed([[30, 40], [36, 12], [42, 40]]),
      poly([[58, 86], [58, 40], [70, 40], [70, 86]]),
      closed([[58, 40], [64, 12], [70, 40]]),
      line(36, 52, 36, 64),
      line(64, 52, 64, 64),
      poly([[42, 60], [50, 50], [58, 60]]),
      arch(50, 5, 76, 86),
      line(10, 86, 90, 86),
    ],
  },
  {
    name: "Venice",
    color: "#14B8A6", // teal gondola
    fills: [gondola],
    strokes: [gondola, line(64, 34, 48, 76), wave(12, 88, 80), wave(22, 78, 88)],
  },
  {
    name: "Pisa",
    color: "#FF8FB1", // pink belfry
    fills: [closed(pisa([[42, 26], [42, 16], [58, 16], [58, 26]]))],
    strokes: [
      poly(pisa([[38, 86], [38, 26], [62, 26], [62, 86]])),
      closed(pisa([[42, 26], [42, 16], [58, 16], [58, 26]])),
      ...[74, 62, 50, 38].map((y) => poly(pisa([[38, y], [62, y]]))),
      line(10, 86, 90, 86),
    ],
  },
  {
    name: "Rome",
    color: "#FFB020", // saffron light through the lower arches
    fills: colosseum.map((x) => `${arch(x, 4, 78, 86)}Z`),
    strokes: [
      poly([[14, 86], [14, 30], [60, 30], [60, 38], [72, 38], [72, 50], [86, 50], [86, 86]]),
      line(14, 50, 72, 50),
      line(14, 70, 86, 70),
      ...colosseum.map((x) => arch(x, 4, 78, 86)),
      ...colosseum.map((x) => arch(x, 4, 60, 70)),
      line(10, 86, 90, 86),
    ],
  },
  {
    name: "Barcelona",
    color: "#FF5364", // coral spire tips
    fills: sagrada.map(([x, y]) => circle(x, y - 3.5, 3)),
    strokes: [
      ...sagrada.map(([x, y]) => spire(x, 5, y, y + 22, 86)),
      ...sagrada.map(([x, y]) => circle(x, y - 3.5, 3)),
      arch(50, 4, 76, 86),
      line(10, 86, 90, 86),
    ],
  },
  {
    name: "Lisbon",
    color: "#FFB020", // saffron tram
    fills: [tram.join("")],
    strokes: [
      ...tram,
      poly([[22, 44], [25, 38], [75, 38], [78, 44]]),
      line(44, 38, 62, 16),
      circle(32, 80, 5),
      circle(68, 80, 5),
      line(10, 86, 90, 86),
    ],
  },
  {
    name: "Athens",
    color: "#FF8FB1", // pink pediment
    fills: [closed([[16, 36], [50, 22], [84, 36]])],
    strokes: [
      closed([[16, 36], [50, 22], [84, 36]]),
      rect(16, 36, 84, 44),
      ...[22, 33, 44, 56, 67, 78].map((x) => line(x, 44, x, 78)),
      line(14, 78, 86, 78),
      line(10, 86, 90, 86),
    ],
  },
  {
    name: "Santorini",
    color: "#2F5BFF", // cobalt dome and bell-tower roof
    fills: [`${arc(43, 54, 13, 13, U, 2 * U)}Z`, closed([[68, 46], [72, 40], [76, 46]])],
    strokes: [
      poly([[26, 78], [26, 54], [60, 54], [60, 78]]),
      arc(43, 54, 13, 13, U, 2 * U),
      line(43, 41, 43, 31),
      line(39, 35, 47, 35),
      poly([[64, 78], [64, 46], [80, 46], [80, 78]]),
      line(69, 60, 69, 54),
      arc(72, 54, 3, 3, U, 2 * U),
      line(75, 54, 75, 60),
      poly([[68, 46], [72, 40], [76, 46]]),
      line(38, 78, 38, 69),
      arc(43, 69, 5, 5, U, 2 * U),
      line(48, 69, 48, 78),
      line(14, 78, 86, 78),
      wave(12, 88, 87),
    ],
  },

  {
    name: "Istanbul",
    color: "#14B8A6", // teal dome
    fills: [`${arc(50, 52, 16, 16, U, 2 * U)}Z`],
    strokes: [
      arc(50, 52, 16, 16, U, 2 * U),
      line(50, 36, 50, 28),
      poly([[30, 86], [30, 52], [70, 52], [70, 86]]),
      arch(50, 5, 74, 86),
      poly([[14, 86], [14, 30], [18, 16], [22, 30], [22, 86]]),
      line(12, 48, 24, 48),
      poly([[78, 86], [78, 30], [82, 16], [86, 30], [86, 86]]),
      line(76, 48, 88, 48),
      line(10, 86, 90, 86),
    ],
  },
  {
    name: "Moscow",
    color: "#FF5364", // coral onion domes
    fills: [onion(50, 32, 8, 22), onion(28, 52, 6, 16), onion(72, 52, 6, 16)],
    strokes: [
      onion(50, 32, 8, 22),
      line(50, 10, 50, 4),
      poly([[42, 86], [42, 32]]),
      poly([[58, 32], [58, 86]]),
      onion(28, 52, 6, 16),
      line(28, 36, 28, 31),
      poly([[22, 86], [22, 52]]),
      poly([[34, 52], [34, 86]]),
      onion(72, 52, 6, 16),
      line(72, 36, 72, 31),
      poly([[66, 86], [66, 52]]),
      poly([[78, 52], [78, 86]]),
      arch(50, 4, 76, 86),
      line(10, 86, 90, 86),
    ],
  },

  // Middle East and Africa
  {
    name: "Marrakech",
    color: "#14B8A6", // teal tile band
    fills: [rect(40, 28, 60, 34)],
    strokes: [
      poly([[40, 86], [40, 28], [60, 28], [60, 86]]),
      line(40, 34, 60, 34),
      rect(45, 18, 55, 28),
      arc(50, 18, 5, 5, U, 2 * U),
      line(50, 13, 50, 7),
      arch(50, 4, 48, 58),
      arch(50, 5, 74, 86),
      line(10, 86, 90, 86),
    ],
  },
  {
    name: "Cairo",
    color: "#FFB020", // saffron sun
    fills: [circle(72, 24, 8)],
    strokes: [
      closed([[14, 86], [40, 42], [66, 86]]),
      line(40, 42, 46, 86),
      poly([[55.4, 68.1], [66, 48], [86, 86]]),
      line(10, 86, 90, 86),
    ],
  },
  {
    name: "Petra",
    color: "#FF8FB1", // pink rose-red stone
    fills: [closed([[20, 86], [20, 42], [24, 42], [24, 24], [42, 24], [50, 14], [58, 24], [76, 24], [76, 42], [80, 42], [80, 86]])],
    strokes: [
      closed([[20, 86], [20, 42], [24, 42], [24, 24], [42, 24], [50, 14], [58, 24], [76, 24], [76, 42], [80, 42], [80, 86]]),
      line(24, 42, 76, 42),
      line(20, 52, 80, 52),
      poly([[34, 52], [50, 44], [66, 52]]),
      line(42, 24, 42, 42),
      line(58, 24, 58, 42),
      ...[27, 37, 63, 73].map((x) => line(x, 52, x, 86)),
      poly([[45, 86], [45, 66], [55, 66], [55, 86]]),
      line(10, 86, 90, 86),
    ],
  },
  {
    name: "Dubai",
    color: "#5BC0FF", // sky glass tower
    fills: [closed([[36, 86], [36, 66], [40, 66], [40, 46], [44, 46], [44, 30], [47, 30], [47, 16], [50, 4], [53, 16], [53, 30], [56, 30], [56, 46], [60, 46], [60, 66], [64, 66], [64, 86]])],
    strokes: [
      poly([[36, 86], [36, 66], [40, 66], [40, 46], [44, 46], [44, 30], [47, 30], [47, 16], [50, 4], [53, 16], [53, 30], [56, 30], [56, 46], [60, 46], [60, 66], [64, 66], [64, 86]]),
      line(10, 86, 90, 86),
    ],
  },
  {
    name: "Cape Town",
    color: "#22A65A", // leaf Table Mountain
    fills: [closed([[10, 72], [18, 52], [24, 46], [28, 36], [64, 36], [70, 46], [76, 40], [84, 52], [90, 72]])],
    strokes: [
      closed([[10, 72], [18, 52], [24, 46], [28, 36], [64, 36], [70, 46], [76, 40], [84, 52], [90, 72]]),
      wave(10, 90, 80),
      wave(18, 82, 88),
    ],
  },

  // South Asia
  {
    name: "Delhi",
    color: "#FFB020", // saffron light through the arch
    fills: [`${arch(50, 10, 54, 86)}Z`],
    strokes: [
      poly([[30, 86], [30, 30], [70, 30], [70, 86]]),
      rect(27, 24, 73, 30),
      rect(36, 16, 64, 24),
      arc(50, 16, 6, 4, U, 2 * U),
      arch(50, 10, 54, 86),
      line(10, 86, 90, 86),
    ],
  },
  {
    name: "Agra",
    color: "#FF8FB1", // pink dome
    fills: [closed([[37, 52], [35, 44], [38, 35], [45, 28], [50, 21], [55, 28], [62, 35], [65, 44], [63, 52]])],
    strokes: [
      line(12, 86, 88, 86),
      line(18, 79, 82, 79),
      poly([[31, 79], [31, 52], [69, 52], [69, 79]]),
      line(44, 79, 44, 66),
      arc(50, 66, 6, 7, U, 2 * U),
      line(56, 66, 56, 79),
      poly([[37, 52], [35, 44], [38, 35], [45, 28], [50, 21], [55, 28], [62, 35], [65, 44], [63, 52]]),
      line(50, 21, 50, 12),
      line(19, 79, 19, 40),
      line(24, 79, 24, 40),
      arc(21.5, 40, 3.5, 4, U, 2 * U),
      line(76, 79, 76, 40),
      line(81, 79, 81, 40),
      arc(78.5, 40, 3.5, 4, U, 2 * U),
    ],
  },
  {
    name: "Jaipur",
    color: "#FF5364", // coral facade
    fills: [hawa.join("")],
    strokes: [...hawa, line(26, 56, 74, 56), line(34, 42, 66, 42), line(42, 30, 58, 30), arc(50, 20, 5, 5, U, 2 * U), line(10, 86, 90, 86)],
  },
  {
    name: "Mumbai",
    color: "#14B8A6", // teal turret domes
    fills: [25, 39, 61, 75].map((x) => `${arc(x, 32, 5, 7, U, 2 * U)}Z`),
    strokes: [
      poly([[20, 86], [20, 40], [80, 40], [80, 86]]),
      line(20, 48, 80, 48),
      ...[25, 39, 61, 75].map((x) => rect(x - 5, 32, x + 5, 40)),
      ...[25, 39, 61, 75].map((x) => arc(x, 32, 5, 7, U, 2 * U)),
      arch(50, 9, 62, 86),
      arch(30, 4, 64, 76),
      arch(70, 4, 64, 76),
      line(10, 86, 90, 86),
    ],
  },
  {
    name: "Goa",
    color: "#22A65A", // leaf palm fronds
    fills: fronds,
    strokes: [...fronds, "M38 80Q40 52 54 32", "M46 80Q48 54 58 33", line(10, 80, 90, 80), wave(12, 88, 88)],
  },
  {
    name: "Varanasi",
    color: "#FFB020", // saffron boat
    fills: [closed([[58, 70], [88, 70], [83, 78], [63, 78]])],
    strokes: [
      poly([[10, 48], [30, 48], [30, 55], [38, 55], [38, 62], [46, 62], [46, 69], [54, 69], [54, 76]]),
      spire(20, 7, 18, 34, 48),
      line(20, 18, 20, 10),
      poly([[20, 10], [28, 13], [20, 16]]),
      closed([[58, 70], [88, 70], [83, 78], [63, 78]]),
      wave(10, 90, 86),
    ],
  },
  {
    name: "Maldives",
    color: "#5BC0FF", // sky lagoon
    fills: [lagoon],
    strokes: [
      poly([[24, 46], [50, 28], [76, 46]]),
      line(24, 46, 76, 46),
      poly([[32, 46], [32, 62]]),
      poly([[68, 46], [68, 62]]),
      poly([[46, 62], [46, 52], [54, 52], [54, 62]]),
      line(20, 62, 80, 62),
      ...[26, 40, 60, 74].map((x) => line(x, 62, x, 86)),
      wave(10, 90, 76),
      line(10, 86, 90, 86),
    ],
  },

  // East and Southeast Asia
  {
    name: "Beijing",
    color: "#2F5BFF", // cobalt roofs
    fills: heaven,
    strokes: [
      ...heaven,
      rect(38, 48, 62, 54),
      rect(42, 34, 58, 39),
      line(50, 26, 50, 18),
      rect(30, 63, 70, 78),
      line(18, 82, 82, 82),
      line(10, 86, 90, 86),
    ],
  },
  {
    name: "Great Wall",
    color: "#22A65A", // leaf hills
    fills: [closed([[10, 86], [10, 80], [28, 68], [46, 56], [62, 56], [76, 64], [90, 70], [90, 86]])],
    strokes: [
      poly([[10, 72], [28, 60], [46, 48]]),
      poly([[10, 80], [28, 68], [46, 56]]),
      poly([[62, 48], [76, 56], [90, 62]]),
      poly([[62, 56], [76, 64], [90, 70]]),
      poly([[46, 56], [46, 32], [62, 32], [62, 56]]),
      poly([[46, 32], [46, 26], [49.2, 26], [49.2, 29], [52.4, 29], [52.4, 26], [55.6, 26], [55.6, 29], [58.8, 29], [58.8, 26], [62, 26], [62, 32]]),
      arch(54, 3, 46, 56),
      line(10, 86, 90, 86),
    ],
  },
  {
    name: "Hong Kong",
    color: "#FF5364", // coral junk sails
    fills: junkSails,
    strokes: [
      ...junkSails,
      ...[26, 36, 46].map((y) => line(38, y, 60 + (y - 20) / 19, y)),
      ...[38, 47].map((y) => line(66, y, 82, y)),
      closed([[12, 60], [30, 64], [70, 64], [88, 58], [80, 74], [22, 74]]),
      wave(10, 90, 84),
    ],
  },
  {
    name: "Seoul",
    color: "#14B8A6", // teal roofs
    fills: [roof(50, 44, 38, 12), roof(50, 22, 26, 10)],
    strokes: [
      roof(50, 44, 38, 12),
      rect(36, 23, 64, 32),
      roof(50, 22, 26, 10),
      ...[26, 38, 62, 74].map((x) => line(x, 45, x, 62)),
      poly([[16, 86], [16, 62], [84, 62], [84, 86]]),
      arch(50, 6, 72, 86),
      arch(30, 4, 74, 86),
      arch(70, 4, 74, 86),
      line(10, 86, 90, 86),
    ],
  },
  {
    name: "Tokyo",
    color: "#FF5364", // coral observation decks
    fills: [rect(34, 52, 66, 58), rect(42, 30, 58, 35)],
    strokes: [
      poly([[24, 86], [38, 58], [45, 35], [49, 12], [50, 6]]),
      poly([[76, 86], [62, 58], [55, 35], [51, 12], [50, 6]]),
      rect(34, 52, 66, 58),
      rect(42, 30, 58, 35),
      line(30, 74, 70, 74),
      line(10, 86, 90, 86),
    ],
  },
  {
    name: "Mount Fuji",
    color: "#5BC0FF", // sky slopes below the snow
    fills: [closed(fuji) + closed(fujiSnow)],
    strokes: [poly(fuji), poly([[34.2, 41], [40, 46], [45, 40], [50, 47], [55, 40], [60, 46], [65.8, 41]]), line(10, 86, 90, 86)],
  },
  {
    name: "Kyoto",
    color: "#FF5364", // coral (the accent): top beam and pillars
    fills: [
      closed([[14, 24], [30, 29], [50, 31], [70, 29], [86, 24], [84, 30], [50, 36], [16, 30]]),
      closed([[29, 36], [35, 36], [33, 86], [27, 86]]),
      closed([[65, 36], [71, 36], [73, 86], [67, 86]]),
    ],
    strokes: [
      poly([[14, 24], [30, 29], [50, 31], [70, 29], [86, 24]]),
      poly([[16, 30], [50, 36], [84, 30]]),
      line(22, 44, 78, 44),
      line(50, 35, 50, 44),
      line(29, 36, 27, 86),
      line(35, 36, 33, 86),
      line(65, 36, 67, 86),
      line(71, 36, 73, 86),
      line(10, 86, 90, 86),
    ],
  },
  {
    name: "Bangkok",
    color: "#2F5BFF", // cobalt tiled spire
    fills: [`${spire(50, 8, 10, 34, 50)}Z`],
    strokes: [
      spire(50, 8, 10, 34, 50),
      poly([[38, 62], [41, 50], [59, 50], [62, 62]]),
      poly([[32, 74], [36, 62], [64, 62], [68, 74]]),
      poly([[26, 86], [26, 74], [74, 74], [74, 86]]),
      spire(16, 4, 52, 66, 86),
      spire(84, 4, 52, 66, 86),
      line(10, 86, 90, 86),
    ],
  },
  {
    name: "Angkor Wat",
    color: "#FFB020", // saffron sandstone towers
    fills: angkor.map((d) => `${d}Z`),
    strokes: [...angkor, ...angkorTiers, poly([[26, 62], [26, 56], [74, 56], [74, 62]]), poly([[12, 70], [12, 62], [88, 62], [88, 70]]), line(10, 70, 90, 70), wave(10, 90, 80), wave(16, 84, 88)],
  },
  {
    name: "Kuala Lumpur",
    color: "#5BC0FF", // sky glass towers
    fills: [closed(petronas(36)), closed(petronas(64))],
    strokes: [poly(petronas(36)), poly(petronas(64)), rect(44, 60, 56, 64), line(10, 86, 90, 86)],
  },
  {
    name: "Singapore",
    color: "#14B8A6", // teal sky park
    fills: [skypark],
    strokes: [
      skypark,
      ...[22, 32, 44, 54, 66, 76].map((x) => line(x, 31, x, 86)),
      line(10, 86, 90, 86),
    ],
  },
  {
    name: "Bali",
    color: "#FF5364", // coral split gate
    fills: [closed(candi), closed(mirror(candi))],
    strokes: [closed(candi), closed(mirror(candi)), line(44, 80, 56, 80), line(44, 74, 56, 74), line(10, 86, 90, 86)],
  },

  // Oceania and the Pacific
  {
    name: "Sydney",
    color: "#14B8A6", // teal middle sail
    fills: [closed([[38, 72], [44, 54], [54, 41], [66, 34], [61, 72]])],
    strokes: [
      poly([[18, 72], [22, 58], [30, 47], [42, 40], [38, 72]]),
      poly([[38, 72], [44, 54], [54, 41], [66, 34], [61, 72]]),
      poly([[60, 72], [66, 58], [74, 50], [84, 47], [81, 72]]),
      line(12, 72, 88, 72),
      line(16, 78, 84, 78),
      wave(10, 90, 86),
      wave(16, 84, 93),
    ],
  },
  {
    name: "Hawaii",
    color: "#FFB020", // saffron surfboard
    fills: [surfboard],
    strokes: [surfboard, line(72, 24, 72, 78), "M12 84Q16 46 44 34Q60 30 62 46Q54 38 46 44Q40 52 48 60", line(10, 86, 90, 86)],
  },
  {
    name: "Easter Island",
    color: "#FF5364", // coral topknot
    fills: [rect(40, 8, 60, 16)],
    strokes: [
      rect(40, 8, 60, 16),
      poly([[32, 86], [34, 50], [36, 26], [42, 16], [58, 16], [64, 26], [66, 50], [68, 86]]),
      line(38, 34, 62, 34),
      poly([[48, 36], [44, 56], [56, 56], [52, 36]]),
      line(43, 66, 57, 66),
      line(10, 86, 90, 86),
    ],
  },

  // The Americas
  {
    name: "New York",
    color: "#14B8A6", // teal copper robe
    fills: [liberty],
    strokes: [
      liberty,
      circle(50, 26, 5),
      line(50, 21, 50, 15),
      line(45, 22, 41, 17),
      line(55, 22, 59, 17),
      line(44, 36, 36, 16),
      line(33, 15, 39, 15),
      "M36 15Q31 10 36 4Q41 10 36 15Z",
      rect(56, 42, 62, 52),
      rect(34, 62, 66, 66),
      poly([[36, 66], [36, 86]]),
      poly([[64, 66], [64, 86]]),
      line(10, 86, 90, 86),
    ],
  },
  {
    name: "Toronto",
    color: "#FF5364", // coral pod
    fills: [cnPod],
    strokes: [
      line(44, 86, 47, 46),
      line(56, 86, 53, 46),
      cnPod,
      line(48, 34, 49, 24),
      line(52, 34, 51, 24),
      rect(46, 20, 54, 24),
      line(50, 20, 50, 4),
      line(10, 86, 90, 86),
    ],
  },
  {
    name: "Seattle",
    color: "#FFB020", // saffron saucer
    fills: [needleTop],
    strokes: [
      poly([[38, 86], [46, 56], [42, 38]]),
      poly([[62, 86], [54, 56], [58, 38]]),
      line(44, 56, 56, 56),
      needleTop,
      poly([[42, 26], [46, 20], [54, 20], [58, 26]]),
      line(50, 20, 50, 6),
      line(10, 86, 90, 86),
    ],
  },
  {
    name: "San Francisco",
    color: "#FF5364", // coral bridge towers
    fills: [rect(26, 16, 34, 84), rect(66, 16, 74, 84)],
    strokes: [
      rect(26, 16, 34, 84),
      rect(66, 16, 74, 84),
      ...[28, 42].flatMap((y) => [line(26, y, 34, y), line(66, y, 74, y)]),
      "M30 16Q50 72 70 16",
      "M30 16Q20 42 10 52",
      "M70 16Q80 42 90 52",
      ...[40, 50, 60].map((x) => line(x, x === 50 ? 44 : 37.5, x, 62)),
      line(10, 62, 90, 62),
      wave(10, 90, 84),
    ],
  },
  {
    name: "Las Vegas",
    color: "#FF8FB1", // pink neon sign
    fills: [vegas],
    strokes: [vegas, star(50, 12, 6), line(36, 34, 64, 34), line(24, 40, 76, 40), line(36, 46, 64, 46), line(46, 58, 46, 86), line(54, 58, 54, 86), line(10, 86, 90, 86)],
  },
  {
    name: "Mexico City",
    color: "#FFB020", // saffron temple
    fills: [chichen],
    strokes: [
      poly([[12, 86], [17, 76], [22, 76], [27, 66], [31, 66], [35, 56], [38, 56], [40, 46], [60, 46], [62, 56], [65, 56], [69, 66], [73, 66], [78, 76], [83, 76], [88, 86]]),
      chichen,
      poly([[47, 46], [47, 39], [53, 39], [53, 46]]),
      line(44, 86, 47, 46),
      line(56, 86, 53, 46),
      line(10, 86, 90, 86),
    ],
  },
  {
    name: "Machu Picchu",
    color: "#22A65A", // leaf peak
    fills: [huayna],
    strokes: [
      huayna,
      poly([[10, 74], [24, 74], [24, 78], [36, 78], [36, 82], [48, 82], [48, 86]]),
      poly([[14, 74], [14, 66], [19, 61], [24, 66], [24, 74]]),
      line(10, 86, 90, 86),
    ],
  },
  {
    name: "Rio",
    color: "#14B8A6", // teal Corcovado
    fills: [corcovado],
    strokes: [
      corcovado,
      closed([[45, 58], [46.5, 36], [53.5, 36], [55, 58]]),
      rect(26, 31, 74, 36),
      circle(50, 26.5, 4),
    ],
  },
];

const pine = (cx: number, top: number, trunk: number, w: number): Pt[] => {
  const h = trunk - top;
  return [
    [cx, top], [cx + w * 0.55, top + h * 0.45], [cx + w * 0.3, top + h * 0.45], [cx + w, trunk],
    [cx - w, trunk], [cx - w * 0.3, top + h * 0.45], [cx - w * 0.55, top + h * 0.45],
  ];
};
const pines = [pine(50, 14, 76, 18), pine(24, 36, 78, 12), pine(76, 32, 78, 13)];
const islandFronds = [leaf(60, 36, 78, 40, 5), leaf(60, 36, 42, 32, -5), leaf(60, 36, 70, 22, 5), leaf(60, 36, 46, 46, -4)];
const lake = "M10 60L90 60L90 76Q50 90 10 76Z";
const hillFront = "M10 76Q40 52 70 72Q80 66 90 70";
const field = closed([[46, 86], [52, 64], [90, 58], [90, 86]]);
const villageRoofs = [closed([[12, 64], [24, 52], [36, 64]]), closed([[40, 46], [50, 22], [60, 46]]), closed([[62, 64], [75, 52], [88, 64]])];
const range = closed([[10, 86], [34, 40], [48, 58], [64, 30], [90, 86]]);
const snowZig: Pt[] = [[36.6, 42], [42, 49], [47, 42], [53, 49], [58, 43], [63.4, 42]];
const snowCap = closed([[50, 18], [63.4, 42], [58, 43], [53, 49], [47, 42], [42, 49], [36.6, 42]]);

/** Generic scenes for places without a landmark of their own, drawn to the same rules as `places`. */
export const landscapes: Place[] = [
  {
    name: "Beach",
    color: "#FFB020", // saffron sun
    fills: [circle(70, 36, 9)],
    strokes: [
      circle(70, 36, 9),
      wave(10, 90, 66),
      arc(34, 52, 18, 12, U, 2 * U),
      line(16, 52, 52, 52),
      line(34, 52, 34, 86),
      line(10, 86, 90, 86),
    ],
  },
  {
    name: "Island",
    color: "#14B8A6", // teal island
    fills: [`${arc(50, 80, 26, 12, U, 2 * U)}Z`],
    strokes: [arc(50, 80, 26, 12, U, 2 * U), "M50 70Q52 50 60 36", ...islandFronds, wave(10, 90, 80), wave(18, 82, 88)],
  },
  {
    name: "Lake",
    color: "#5BC0FF", // sky water
    fills: [lake],
    strokes: [poly([[10, 60], [34, 34], [50, 50], [64, 38], [90, 60]]), lake, line(30, 68, 46, 68), line(54, 74, 70, 74)],
  },
  {
    name: "Forest",
    color: "#22A65A", // leaf pines
    fills: pines.map(closed),
    strokes: [
      ...pines.map(closed),
      line(50, 76, 50, 86),
      line(24, 78, 24, 86),
      line(76, 78, 76, 86),
      line(10, 86, 90, 86),
    ],
  },
  {
    name: "Waterfall",
    color: "#2F5BFF", // cobalt falling water
    fills: [rect(40, 28, 58, 72)],
    strokes: [
      poly([[10, 44], [22, 28], [40, 28]]),
      poly([[58, 28], [72, 24], [90, 38]]),
      rect(40, 28, 58, 72),
      line(46, 34, 46, 66),
      line(52, 38, 52, 70),
      wave(14, 86, 78),
      line(10, 86, 90, 86),
    ],
  },
  {
    name: "Hills",
    color: "#22A65A", // leaf front hill
    fills: [`M10 86L${hillFront.slice(1)}L90 86Z`],
    strokes: ["M10 62Q34 36 58 58Q74 46 90 56", hillFront, line(10, 86, 90, 86)],
  },
  {
    name: "Countryside",
    color: "#FFB020", // saffron wheat field
    fills: [field],
    strokes: [
      field,
      line(60, 86, 62, 62.7),
      line(72, 86, 72, 61),
      line(84, 86, 82, 59.3),
      poly([[16, 86], [16, 62], [40, 62], [40, 86]]),
      poly([[12, 64], [28, 48], [44, 64]]),
      poly([[24, 86], [24, 72], [32, 72], [32, 86]]),
      line(10, 86, 90, 86),
    ],
  },
  {
    name: "Village",
    color: "#FF8FB1", // pink roofs
    fills: villageRoofs,
    strokes: [
      ...villageRoofs,
      poly([[16, 86], [16, 64], [32, 64], [32, 86]]),
      poly([[42, 86], [42, 46], [58, 46], [58, 86]]),
      arch(50, 4, 76, 86),
      poly([[66, 86], [66, 64], [84, 64], [84, 86]]),
      line(10, 86, 90, 86),
    ],
  },
  {
    name: "City",
    color: "#2F5BFF", // cobalt tower
    fills: [rect(40, 22, 54, 86)],
    strokes: [
      rect(12, 56, 26, 86),
      rect(26, 40, 40, 86),
      rect(40, 22, 54, 86),
      line(47, 22, 47, 12),
      rect(54, 48, 68, 86),
      rect(68, 34, 82, 86),
      ...[44, 52, 60].map((y) => line(72, y, 78, y)),
      line(10, 86, 90, 86),
    ],
  },
  {
    name: "Desert",
    color: "#FF5364", // coral sun
    fills: [circle(68, 30, 10)],
    strokes: [
      circle(68, 30, 10),
      "M10 70Q34 54 58 68Q74 60 90 66",
      arch(37, 5, 46, 86),
      "M32 72L24 72Q20 72 20 68L20 56A3 3 0 0 1 26 56L26 66L32 66",
      "M42 64L50 64Q54 64 54 60L54 50A3 3 0 0 0 48 50L48 58L42 58",
      line(10, 86, 90, 86),
    ],
  },
  {
    name: "Mountains",
    color: "#14B8A6", // teal range
    fills: [range],
    strokes: [range, line(48, 58, 56, 86)],
  },
  {
    name: "Snow peak",
    color: "#2F5BFF", // cobalt slopes below the snow
    fills: [closed([[12, 86], [50, 18], [88, 86]]) + snowCap],
    strokes: [poly([[12, 86], [50, 18], [88, 86]]), poly(snowZig), line(10, 86, 90, 86)],
  },
];

/** A list tile's background: the place colour mixed 14% into white. */
export const tint = (hex: string) => `color-mix(in srgb, ${hex} 14%, white)`;

/** Fills first, then one ink path on top. Use width 2.4 at ~190px and 3.4 at 64px. */
export function PlaceIcon({ place, width = 2.4 }: { place: Place; width?: number }) {
  return (
    <svg viewBox="0 0 100 100" className="ds-icon" aria-label={place.name} role="img">
      {place.fills.map((d, i) => (
        <path key={i} d={d} fill={place.color} fillRule="evenodd" />
      ))}
      <path
        d={place.strokes.join("")}
        stroke="#141517"
        strokeWidth={width}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
