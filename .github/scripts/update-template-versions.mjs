// Syncs @openuidev/* dependency versions in the CLI templates to the latest
// published versions on npm, regenerating template lockfiles. Run by the
// update-template-versions workflow after a package publish; the resulting
// diff (if any) is opened as a PR. Templates are fetched from main at scaffold
// time, so merging that PR is what ships the new versions to users.
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const TEMPLATES_DIR = "packages/openui-cli/src/templates";
const SCOPE = "@openuidev/";

const latestCache = new Map();
function latestVersion(name) {
  if (!latestCache.has(name)) {
    const version = execSync(`npm view ${name} version`, { encoding: "utf8" }).trim();
    latestCache.set(name, version);
  }
  return latestCache.get(name);
}

const changes = [];
for (const template of fs.readdirSync(TEMPLATES_DIR)) {
  const templateDir = path.join(TEMPLATES_DIR, template);
  const pkgPath = path.join(templateDir, "package.json");
  if (!fs.existsSync(pkgPath)) continue;
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));

  let templateChanged = false;
  for (const section of ["dependencies", "devDependencies"]) {
    const deps = pkg[section];
    if (!deps) continue;
    for (const [name, range] of Object.entries(deps)) {
      if (!name.startsWith(SCOPE)) continue;
      // Only plain versions and simple ^/~ ranges; leave link:/file:/etc alone.
      if (!/^[\^~]?\d/.test(range)) continue;
      const prefix = /^[\^~]/.test(range) ? range[0] : "";
      const current = range.replace(/^[\^~]/, "");
      const latest = latestVersion(name);
      if (current === latest) continue;
      deps[name] = `${prefix}${latest}`;
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
  console.log("Templates already match the latest published versions.");
} else {
  console.log("Updated:");
  for (const change of changes) console.log(`  ${change}`);
}
