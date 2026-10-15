// Prints the Lighthouse CI scores in lighthouse-reports/<form factor>/ as a
// Markdown table, one row per page and form factor. CI appends it to the job
// summary; locally it just prints.
//
//   node scripts/lighthouse-summary.mjs [reports dir]

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const reportsDir = process.argv[2] ?? "lighthouse-reports";
const CATEGORIES = [
  ["performance", "Performance"],
  ["accessibility", "Accessibility"],
  ["best-practices", "Best practices"],
  ["seo", "SEO"],
];

function badge(score) {
  if (typeof score !== "number") return "–";
  const value = Math.round(score * 100);
  const mark = value >= 90 ? "🟢" : value >= 50 ? "🟠" : "🔴";
  return `${mark} ${value}`;
}

const rows = [];
for (const formFactor of existsSync(reportsDir) ? readdirSync(reportsDir).sort() : []) {
  const manifestPath = join(reportsDir, formFactor, "manifest.json");
  if (!existsSync(manifestPath)) continue;

  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  // LHCI marks the median run for each URL as the representative one.
  for (const run of manifest.filter((entry) => entry.isRepresentativeRun)) {
    const path = new URL(run.url).pathname;
    const scores = CATEGORIES.map(([id]) => badge(run.summary[id]));
    rows.push(`| \`${path}\` | ${formFactor} | ${scores.join(" | ")} |`);
  }
}

if (rows.length === 0) {
  console.log(`No Lighthouse reports found in ${reportsDir}.`);
} else {
  console.log("### Lighthouse scores\n");
  console.log(`| Page | Device | ${CATEGORIES.map(([, label]) => label).join(" | ")} |`);
  console.log(`| --- | --- | ${CATEGORIES.map(() => "---").join(" | ")} |`);
  console.log(rows.join("\n"));
  console.log("\nMedian of three runs per page. Full HTML reports are in the workflow artifacts.");
}
