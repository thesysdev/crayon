import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const pnpmCommand = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const expectedPublishedPackages = new Map([
  ["packages/browser-bundle", "@openuidev/browser-bundle"],
  ["packages/lang-core", "@openuidev/lang-core"],
  ["packages/openui-cli", "@openuidev/cli"],
  ["packages/react-email", "@openuidev/react-email"],
  ["packages/react-headless", "@openuidev/react-headless"],
  ["packages/react-lang", "@openuidev/react-lang"],
  ["packages/react-ui", "@openuidev/react-ui"],
  ["packages/svelte-lang", "@openuidev/svelte-lang"],
  ["packages/vue-lang", "@openuidev/vue-lang"],
]);

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function normalizedRepositoryUrl(url) {
  return url?.replace(/^git\+/, "").replace(/\.git$/, "");
}

const workspaceOutput = execFileSync(
  pnpmCommand,
  ["--recursive", "list", "--depth", "-1", "--json"],
  {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  },
);
const workspaceProjects = JSON.parse(workspaceOutput);
const errors = [];
const discoveredPublicPackages = new Set();
const rootManifest = readJson(join(repoRoot, "package.json"));

if (rootManifest.private !== true) {
  errors.push("The workspace root must be private.");
}
if (rootManifest.packageManager !== "pnpm@10.34.5") {
  errors.push("The workspace root must pin packageManager to pnpm@10.34.5.");
}

for (const project of workspaceProjects) {
  const relativeDirectory =
    project.path === repoRoot ? "." : project.path.slice(repoRoot.length + 1).replaceAll("\\", "/");
  if (relativeDirectory === ".") {
    continue;
  }

  const manifest = readJson(join(project.path, "package.json"));
  const expectedName = expectedPublishedPackages.get(relativeDirectory);

  if (!expectedName) {
    if (manifest.private !== true) {
      errors.push(`${relativeDirectory} is not a published package and must set "private": true.`);
    }
    continue;
  }

  discoveredPublicPackages.add(relativeDirectory);
  if (manifest.private === true) {
    errors.push(`${expectedName} is unexpectedly private.`);
  }
  if (manifest.name !== expectedName) {
    errors.push(`${relativeDirectory} is named ${manifest.name}; expected ${expectedName}.`);
  }
  if (
    typeof manifest.version !== "string" ||
    !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(manifest.version)
  ) {
    errors.push(`${expectedName} does not have a valid SemVer version.`);
  }
  if (
    normalizedRepositoryUrl(manifest.repository?.url) !== "https://github.com/thesysdev/openui" ||
    manifest.repository?.directory !== relativeDirectory
  ) {
    errors.push(`${expectedName} has incorrect repository metadata.`);
  }
  if (
    !Array.isArray(manifest.files) ||
    !manifest.files.includes("dist") ||
    !manifest.files.includes("README.md")
  ) {
    errors.push(`${expectedName} must publish dist and README.md.`);
  }
  if (!manifest.exports && !manifest.bin) {
    errors.push(`${expectedName} must define exports or a bin entry.`);
  }
  if (!manifest.scripts?.build) {
    errors.push(`${expectedName} must define a build script.`);
  }
  if (manifest.publishConfig?.access && manifest.publishConfig.access !== "public") {
    errors.push(`${expectedName} has non-public publishConfig access.`);
  }
}

for (const [directory, packageName] of expectedPublishedPackages) {
  if (!discoveredPublicPackages.has(directory)) {
    errors.push(`${packageName} is missing from the pnpm workspace.`);
  }
}

const changesetsConfig = readJson(join(repoRoot, ".changeset", "config.json"));
if (
  changesetsConfig.access !== "public" ||
  changesetsConfig.baseBranch !== "main" ||
  changesetsConfig.updateInternalDependencies !== "patch" ||
  changesetsConfig.bumpVersionsWithWorkspaceProtocolOnly !== true ||
  changesetsConfig.fixed?.length !== 0 ||
  changesetsConfig.linked?.length !== 0
) {
  errors.push(
    "Changesets must use public access, main, patch internal updates, workspace-protocol handling, and independent versions.",
  );
}

if (
  !Array.isArray(changesetsConfig.changelog) ||
  changesetsConfig.changelog[0] !== "@changesets/changelog-github" ||
  changesetsConfig.changelog[1]?.repo !== "thesysdev/openui"
) {
  errors.push("Changesets must generate changelogs from thesysdev/openui.");
}

if (errors.length) {
  console.error("Release configuration validation failed:\n");
  console.error(errors.map((error) => `- ${error}`).join("\n"));
  process.exit(1);
}

console.log(
  `Release configuration is valid: ${expectedPublishedPackages.size} public packages and all other workspaces are private.`,
);
