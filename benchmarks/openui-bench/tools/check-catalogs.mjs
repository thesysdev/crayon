// Verifies the three protocol catalog surfaces stay equivalent to
// catalog/public-catalog.json: same 70 component names, same prop names in
// the same order, same required flags and enum values. Runs offline.
// Usage: node tools/check-catalogs.mjs
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const reference = JSON.parse(readFileSync(join(ROOT, "catalog/public-catalog.json"), "utf8"));

// One comparable shape per surface: [name, [propName, {req, enum}][]][]
const norm = (catalog) =>
  JSON.stringify(
    Object.entries(catalog)
      .map(([name, def]) => [
        name,
        def.props.map(([pn, s]) => [pn, { req: Boolean(s.req), enum: s.enum ?? null }]),
      ])
      .sort((a, b) => a[0].localeCompare(b[0])),
  );

const surfaces = {
  openui: (await import(join(ROOT, "protocols/openui/catalog.ts"))).CATALOG,
  jsonrender: (await import(join(ROOT, "protocols/jsonrender/catalog.ts"))).CATALOG,
  a2ui: JSON.parse(readFileSync(join(ROOT, "protocols/a2ui/catalog-surface.json"), "utf8")),
};

const want = norm(reference);
let ok = true;
for (const [name, catalog] of Object.entries(surfaces)) {
  const got = norm(catalog);
  const match = got === want;
  if (!match) ok = false;
  console.log(`${name.padEnd(11)} ${Object.keys(catalog).length} components  ${match ? "MATCH" : "DRIFT"}`);
  if (!match) {
    const w = new Set(Object.keys(reference));
    const g = new Set(Object.keys(catalog));
    for (const n of w) if (!g.has(n)) console.log(`  missing: ${n}`);
    for (const n of g) if (!w.has(n)) console.log(`  extra: ${n}`);
    for (const n of [...w].filter((x) => g.has(x))) {
      if (norm({ [n]: reference[n] }) !== norm({ [n]: catalog[n] })) console.log(`  differs: ${n}`);
    }
  }
}
process.exit(ok ? 0 : 1);
