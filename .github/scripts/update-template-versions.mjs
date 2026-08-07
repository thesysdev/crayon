// Syncs the CLI templates' dependency versions to the versions declared in
// this repo's packages/*/package.json — the source of truth for what was just
// published (npm's registry metadata can lag right after a publish).
// Regenerates template lockfiles. Run by the update-template-versions
// workflow after a package publish; the resulting diff (if any) is opened as
// a PR. Templates are fetched from main at scaffold time, so merging that PR
// is what ships the new versions to users.
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const TEMPLATES_DIR = "packages/openui-cli/src/templates";
const SCOPE = "@openuidev/";

// name -> version for every publishable @openuidev/* workspace package.
const workspaceVersions = new Map();
for (const dir of fs.readdirSync("packages")) {
  const pkgPath = path.join("packages", dir, "package.json");
  if (!fs.existsSync(pkgPath)) continue;
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  if (!pkg.name?.startsWith(SCOPE) || !pkg.version || pkg.private) continue;
  workspaceVersions.set(pkg.name, pkg.version);
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
      const target = workspaceVersions.get(name);
      if (!target) continue;
      // Only plain versions and simple ^/~ ranges; leave link:/file:/etc alone.
      if (!/^[\^~]?\d/.test(range)) continue;
      const prefix = /^[\^~]/.test(range) ? range[0] : "";
      const current = range.replace(/^[\^~]/, "");
      if (current === target) continue;
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
