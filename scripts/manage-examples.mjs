import { spawnSync } from "node:child_process";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const examplesRoot = resolve(repoRoot, "examples");
const command = process.argv[2];

const commands = new Set(["install", "update", "verify"]);
if (!commands.has(command)) {
  console.error("Usage: node scripts/manage-examples.mjs <install|update|verify>");
  process.exit(1);
}

function findManifests(directory) {
  const manifests = [];

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;

    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      manifests.push(...findManifests(path));
    } else if (entry.name === "package.json") {
      manifests.push(path);
    }
  }

  return manifests;
}

const applications = findManifests(examplesRoot)
  .map((manifestPath) => {
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    return {
      directory: dirname(manifestPath),
      manifest,
      manifestPath,
      path: relative(repoRoot, dirname(manifestPath)),
    };
  })
  .sort((left, right) => left.path.localeCompare(right.path));

const dependencyFields = ["dependencies", "devDependencies"];

function openUIDependencyNames(manifest) {
  return dependencyFields.flatMap((field) =>
    Object.keys(manifest[field] ?? {}).filter((name) => name.startsWith("@openuidev/")),
  );
}

function runPnpm(application, args) {
  console.log(`\n==> ${application.path}`);
  const result = spawnSync(
    "pnpm",
    ["--dir", application.directory, "--ignore-workspace", ...args],
    {
      cwd: repoRoot,
      env: process.env,
      stdio: "inherit",
    },
  );

  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function latestVersion(name) {
  const result = spawnSync("pnpm", ["view", name, "version", "--json"], {
    cwd: repoRoot,
    encoding: "utf8",
  });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    process.stderr.write(result.stderr);
    process.exit(result.status ?? 1);
  }

  const version = JSON.parse(result.stdout);
  if (typeof version !== "string") {
    throw new Error(`Could not resolve the latest version of ${name}`);
  }

  return version;
}

const latestOpenUIVersions =
  command === "update"
    ? new Map(
        [...new Set(applications.flatMap(({ manifest }) => openUIDependencyNames(manifest)))]
          .sort()
          .map((name) => [name, latestVersion(name)]),
      )
    : new Map();

function pinLatestOpenUIVersions(application) {
  const manifest = JSON.parse(readFileSync(application.manifestPath, "utf8"));
  let changed = false;

  for (const field of dependencyFields) {
    for (const name of openUIDependencyNames({ [field]: manifest[field] })) {
      const version = latestOpenUIVersions.get(name);
      if (version && manifest[field][name] !== version) {
        manifest[field][name] = version;
        changed = true;
      }
    }
  }

  for (const name of Object.keys(manifest.overrides ?? {})) {
    const version = latestOpenUIVersions.get(name);
    if (
      version &&
      typeof manifest.overrides[name] === "string" &&
      manifest.overrides[name] !== version
    ) {
      manifest.overrides[name] = version;
      changed = true;
    }
  }

  if (changed) {
    writeFileSync(application.manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  }

  return openUIDependencyNames(manifest).length > 0;
}

for (const application of applications) {
  if (command === "install") {
    runPnpm(application, ["install", "--frozen-lockfile"]);
    continue;
  }

  if (command === "update") {
    if (pinLatestOpenUIVersions(application)) {
      runPnpm(application, ["install", "--lockfile-only", "--fix-lockfile"]);
    }
    continue;
  }

  if (!application.manifest.scripts?.verify) {
    console.error(`Missing a verify script in ${application.path}/package.json`);
    process.exit(1);
  }

  runPnpm(application, ["run", "verify"]);
}

console.log(`\n${command} completed for ${applications.length} standalone example applications.`);
