// Syncs the CLI templates (in the openui-templates checkout at TEMPLATES_DIR)
// to the versions declared in this repo's packages/*/package.json
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

// True when a > b, comparing plain x.y.z triples.
function isNewer(a, b) {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] ?? 0) !== (pb[i] ?? 0)) return (pa[i] ?? 0) > (pb[i] ?? 0);
  }
  return false;
}

const templatesRoot = process.env.TEMPLATES_DIR;
if (!templatesRoot) {
  console.error("TEMPLATES_DIR env var is required (path to the openui-templates checkout).");
  process.exit(1);
}

// map of every @openuidev/* workspace package.
const workspaceVersions = new Map();
for (const dir of fs.readdirSync("packages")) {
  const pkgPath = path.join("packages", dir, "package.json");

  if (!fs.existsSync(pkgPath)) continue;

  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  if (!pkg.name?.startsWith("@openuidev/") || !pkg.version || pkg.private) continue;
  workspaceVersions.set(pkg.name, pkg.version);
}

// index.json is the templates repo's source of truth for what exists.
const index = JSON.parse(fs.readFileSync(path.join(templatesRoot, "index.json"), "utf8"));

const changes = [];
for (const { name: template } of index.templates) {
  const templateDir = path.join(templatesRoot, template);
  const pkgPath = path.join(templateDir, "package.json");
  if (!fs.existsSync(pkgPath)) continue;
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));

  let templateChanged = false;
  for (const section of ["dependencies", "devDependencies"]) {
    const deps = pkg[section];
    if (!deps) continue;
    for (const [name, range] of Object.entries(deps)) {
      const target = workspaceVersions.get(name);
      if (!target) continue;
      // Only plain versions and simple ^/~ ranges; leave link:/file:/etc alone.
      if (!/^[\^~]?\d/.test(range)) continue;
      const prefix = /^[\^~]/.test(range) ? range[0] : "";
      const current = range.replace(/^[\^~]/, "");
      if (current === target) continue;
      // Never downgrade: a template can be deliberately ahead of the
      // workspace (hotfix landed here first) — syncing it backwards would
      // open noise PRs.
      if (!isNewer(target, current)) continue;
      deps[name] = `${prefix}${target}`;
      templateChanged = true;
      changes.push(`${template}: ${name} ${range} -> ${deps[name]}`);
    }
  }
  if (!templateChanged) continue;

  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
  if (fs.existsSync(path.join(templateDir, "package-lock.json"))) {
    execSync("npm install --package-lock-only --ignore-scripts --no-audit --no-fund", {
      cwd: templateDir,
      stdio: "inherit",
    });
  }
}

if (changes.length === 0) {
  console.log("Templates already match the workspace package versions.");
} else {
  console.log("Updated:");
  for (const change of changes) console.log(`  ${change}`);
}
