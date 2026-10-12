// Design tokens for the travel planner: the single source for colors and type.
// `tokensCss` turns them into `--ds-*` CSS variables, so CSS and TS read the same values.

/* ---------- Color ---------- */

// Cool neutral greys from timeless.co: the site's page grey #f1f2f3 is the canvas, white objects
// float on it, and every step keeps the same slight blue lean so nothing reads warm.
export const neutral = {
  0: "#ffffff",
  50: "#f8f9fa",
  100: "#f1f2f3",
  200: "#e7e9eb",
  300: "#dcdfe2",
  400: "#afb3b8",
  500: "#81858b",
  600: "#5f6369",
  700: "#4a4d52",
  800: "#2c2e31",
  900: "#121314",
  950: "#000000",
} as const;

// Coral red #ff5364: the one accent, Shubham's chosen base.
// 500 fills marks, rules and large type; 600 fills buttons with small white text;
// 700 carries accent-colored text on the canvas (each passes WCAG AA where used).
export const accent = {
  50: "#fff0f1",
  100: "#ffdde0",
  200: "#ffbac1",
  300: "#ff8f9a",
  400: "#ff6f7d",
  500: "#ff5364",
  600: "#e0263c",
  700: "#b3172b",
  800: "#8a1424",
  900: "#5f111b",
} as const;

// Supporting colors from the site's objects and its quota chart, for imagery, covers,
// categories and charts. They never replace the accent for actions.
export const support = {
  cobalt: "#004ab0",
  blue: "#0083ff",
  cyan: "#61d4fb",
  violet: "#a78bfa",
  emerald: "#10b980",
  amber: "#feb600",
  magenta: "#e5359e",
  mist: "#b5dce6",
} as const;

// The red-to-amber wash on the podcast card: for hero imagery and covers, never behind text runs.
export const gradient = {
  sunset: "linear-gradient(160deg, #ff2d55 0%, #ff5364 45%, #feb600 100%)",
} as const;

// What components should actually use. Each role names a primitive above.
export const color = {
  canvas: neutral[100],
  surface: neutral[50],
  surfaceRaised: neutral[0],
  surfaceSunken: neutral[200],
  line: neutral[300],
  lineSoft: neutral[100],
  ink: neutral[950],
  inkSecondary: neutral[700],
  inkTertiary: neutral[600],
  inkDisabled: neutral[400],
  inkInverse: neutral[0],
  accent: accent[500],
  accentHover: accent[600],
  accentPressed: accent[700],
  accentSoft: accent[100],
  accentText: accent[700],
  onAccent: neutral[0],
} as const;

export type ColorRole = keyof typeof color;

/* ---------- Typography ---------- */

// One face for everything: Timeless Serif, Regular only, set as on the timeless.co playground
// (weight 380, STYL 40, between Display at 0 and Text at 100). The variation settings pin the
// weight, so bolder font-weight values have no effect inside the design system.
export const font = {
  serif: 'var(--font-display, "Timeless Serif"), Georgia, serif',
} as const;

export const fontVariation = '"wght" 380, "STYL" 40';

export type TypeStyle = {
  family: keyof typeof font;
  size: number;
  lineHeight: number;
  weight: number;
  tracking: string;
  uppercase?: boolean;
  role: string;
};

// Sizes carry the hierarchy now that there is one weight. Display sizes use the playground's
// -3.5% tracking and 1.00 leading.
export const type = {
  displayXl: { family: "serif", size: 96, lineHeight: 1, weight: 380, tracking: "-0.035em", role: "Hero destination, one per page" },
  displayL: { family: "serif", size: 72, lineHeight: 1, weight: 380, tracking: "-0.035em", role: "Trip title on the board" },
  displayM: { family: "serif", size: 56, lineHeight: 1.05, weight: 380, tracking: "-0.03em", role: "Section openers" },
  headingL: { family: "serif", size: 40, lineHeight: 1.1, weight: 380, tracking: "-0.015em", role: "Day or city headings" },
  headingM: { family: "serif", size: 30, lineHeight: 1.15, weight: 380, tracking: "-0.01em", role: "Card and panel titles" },
  headingS: { family: "serif", size: 22, lineHeight: 1.25, weight: 380, tracking: "-0.005em", role: "Small titles, stay names" },
  quote: { family: "serif", size: 28, lineHeight: 1.3, weight: 380, tracking: "-0.01em", role: "Pull-quotes and the agent's voice" },
  numeral: { family: "serif", size: 48, lineHeight: 1, weight: 380, tracking: "-0.02em", role: "Prices, dates, ratings" },
  title: { family: "serif", size: 20, lineHeight: 1.3, weight: 380, tracking: "-0.01em", role: "UI titles, dialog headers" },
  bodyL: { family: "serif", size: 19, lineHeight: 1.5, weight: 380, tracking: "0em", role: "Intro paragraphs" },
  body: { family: "serif", size: 17, lineHeight: 1.5, weight: 380, tracking: "0em", role: "Default reading text" },
  bodyS: { family: "serif", size: 15, lineHeight: 1.45, weight: 380, tracking: "0em", role: "Secondary text, card details" },
  label: { family: "serif", size: 15, lineHeight: 1.2, weight: 380, tracking: "0em", role: "Buttons, inputs, tabs" },
  caption: { family: "serif", size: 13, lineHeight: 1.35, weight: 380, tracking: "0.005em", role: "Photo credits, meta" },
  overline: { family: "serif", size: 12, lineHeight: 1.2, weight: 380, tracking: "0.08em", uppercase: true, role: "Kickers above titles" },
} as const satisfies Record<string, TypeStyle>;

export type TypeToken = keyof typeof type;

/* ---------- CSS output ---------- */

const kebab = (s: string) => s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

/**
 * Every token as a `--ds-*` custom property on `selector`. Pass the element that carries
 * `dsFontVariables`: custom properties resolve where they are declared, so declaring them on
 * `:root` above that element would lose --font-display and fall back to Georgia.
 */
export function tokensCss(selector = ":root"): string {
  const lines: string[] = [];
  for (const [k, v] of Object.entries(neutral)) lines.push(`--ds-neutral-${k}: ${v};`);
  for (const [k, v] of Object.entries(accent)) lines.push(`--ds-accent-${k}: ${v};`);
  for (const [k, v] of Object.entries(support)) lines.push(`--ds-support-${k}: ${v};`);
  for (const [k, v] of Object.entries(gradient)) lines.push(`--ds-gradient-${k}: ${v};`);
  for (const [k, v] of Object.entries(color)) lines.push(`--ds-color-${kebab(k)}: ${v};`);
  for (const [k, v] of Object.entries(font)) lines.push(`--ds-font-${k}: ${v};`);
  lines.push(`--ds-font-variation: ${fontVariation};`);
  for (const [k, t] of Object.entries(type) as [string, TypeStyle][]) {
    const n = kebab(k);
    lines.push(
      `--ds-type-${n}-family: var(--ds-font-${t.family});`,
      `--ds-type-${n}-size: ${t.size / 16}rem;`,
      `--ds-type-${n}-line-height: ${t.lineHeight};`,
      `--ds-type-${n}-weight: ${t.weight};`,
      `--ds-type-${n}-tracking: ${t.tracking};`,
    );
  }
  return `${selector} {\n  ${lines.join("\n  ")}\n}`;
}

/* ---------- Contrast (WCAG 2) ---------- */

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
