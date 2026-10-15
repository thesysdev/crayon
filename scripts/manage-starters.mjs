import { spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const examplesRoot = resolve(repoRoot, "examples");
const templatesRoot = resolve(repoRoot, "templates");
const dependencyFields = ["dependencies", "devDependencies"];
const [target, command] = process.argv.slice(2);

const commandsByTarget = {
  examples: new Set(["install", "update", "verify"]),
  templates: new Set(["update"]),
};

if (!commandsByTarget[target]?.has(command)) {
  console.error(
    "Usage: node scripts/manage-starters.mjs examples <install|update|verify> | templates update",
  );
  process.exit(1);
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
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

function applicationFromManifest(manifestPath) {
  return {
    directory: dirname(manifestPath),
    manifest: readJson(manifestPath),
    manifestPath,
    path: relative(repoRoot, dirname(manifestPath)),
  };
}

function openUIDependencyNames(manifest) {
  return dependencyFields.flatMap((field) =>
    Object.keys(manifest[field] ?? {}).filter((name) => name.startsWith("@openuidev/")),
  );
}

function runCommand(command, args, options) {
  const result = spawnSync(command, args, { stdio: "inherit", ...options });

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

  let response;
  try {
    response = JSON.parse(result.stdout);
  } catch {
    throw new Error(`Could not resolve the latest version of ${name}: ${result.stdout.trim()}`);
  }

  const version = Array.isArray(response)
    ? response.find((value) => typeof value === "string")
    : response;
  if (typeof version !== "string") {
    throw new Error(`Could not resolve the latest version of ${name}: ${result.stdout.trim()}`);
  }

  return version;
}

function latestOpenUIVersions(manifests) {
  return new Map(
    [...new Set(manifests.flatMap(openUIDependencyNames))]
      .sort()
      .map((name) => [name, latestVersion(name)]),
  );
}

const registryCache = new Map();

function registryView(spec, field) {
  const key = `${spec} ${field}`;
  if (!registryCache.has(key)) {
    const result = spawnSync("pnpm", ["view", spec, field, "--json"], {
      cwd: repoRoot,
      encoding: "utf8",
    });

    if (result.error) throw result.error;
    if (result.status !== 0) {
      // A range with no published match is an answer; any other failure (network,
      // rate limit) must stop the run, or the app would lose its constraint.
      let error;
      try {
        error = JSON.parse(result.stdout).error;
      } catch {}
      if (error?.code !== "E404" || !error.summary?.startsWith("No match found")) {
        throw new Error(`pnpm view ${spec} ${field} failed: ${error?.summary ?? result.stderr}`);
      }
    }
    registryCache.set(
      key,
      result.status === 0 && result.stdout.trim() ? JSON.parse(result.stdout) : undefined,
    );
  }

  return registryCache.get(key);
}

function compareVersions(left, right) {
  const [a, b] = [left, right].map((version) => version.split(".").map(Number));
  return a[0] - b[0] || a[1] - b[1] || a[2] - b[2];
}

// Prereleases and versions above the latest tag are never picked.
function highestVersionInRanges(name, ranges, latest) {
  const [first, ...rest] = ranges.map((range) =>
    [registryView(`${name}@${range}`, "version") ?? []].flat(),
  );
  const versions = first.filter(
    (version) =>
      !version.includes("-") &&
      compareVersions(version, latest) <= 0 &&
      rest.every((matches) => matches.includes(version)),
  );
  return versions.sort(compareVersions).at(-1);
}

// Keep each OpenUI package inside the ranges the app's other OpenUI packages
// declare, so an app follows the lang-core its renderer was built for.
function applicationOpenUIVersions(application, latestVersions) {
  const names = openUIDependencyNames(application.manifest);
  const versions = new Map(latestVersions);

  // Lowering one package can change the ranges it declares, so repeat until
  // nothing moves. A conflict only counts once the versions have settled.
  let conflicts = [];
  for (let pass = 1, changed = true; changed; pass++) {
    if (pass > 10) {
      const pending = conflicts.length > 0 ? `; no version satisfies ${conflicts.join("; ")}` : "";
      throw new Error(`${application.path}: OpenUI versions did not settle after 10 passes${pending}`);
    }
    changed = false;
    const ranges = new Map();
    conflicts = [];

    for (const name of names) {
      for (const field of ["dependencies", "peerDependencies"]) {
        const declared = registryView(`${name}@${versions.get(name)}`, field) ?? {};
        for (const [dependency, range] of Object.entries(declared)) {
          if (names.includes(dependency) && dependency !== name) {
            ranges.set(dependency, [...(ranges.get(dependency) ?? []), range]);
          }
        }
      }
    }

    // A package nothing constrains any more goes back to latest.
    for (const name of names) {
      if (!ranges.has(name) && versions.get(name) !== latestVersions.get(name)) {
        versions.set(name, latestVersions.get(name));
        changed = true;
      }
    }

    for (const [name, nameRanges] of ranges) {
      const version = highestVersionInRanges(name, nameRanges, latestVersions.get(name));
      if (!version) {
        conflicts.push(`${name} (${nameRanges.join(", ")})`);
      } else if (version !== versions.get(name)) {
        versions.set(name, version);
        changed = true;
      }
    }

    if (!changed && conflicts.length > 0) {
      throw new Error(`${application.path}: no version satisfies ${conflicts.join("; ")}`);
    }
  }

  return versions;
}

function pinOpenUIDependencyVersions(manifest, latestVersions, { preserveRange = false } = {}) {
  let changed = false;

  for (const field of dependencyFields) {
    for (const name of Object.keys(manifest[field] ?? {})) {
      if (!name.startsWith("@openuidev/")) continue;

      const latest = latestVersions.get(name);
      const current = manifest[field][name];
      const rangePrefix = preserveRange && current.startsWith("^") ? "^" : "";
      const tildePrefix = preserveRange && current.startsWith("~") ? "~" : "";
      const next = latest ? `${rangePrefix}${tildePrefix}${latest}` : current;
      if (current !== next) {
        manifest[field][name] = next;
        changed = true;
      }
    }
  }

  for (const name of Object.keys(manifest.overrides ?? {})) {
    if (!name.startsWith("@openuidev/")) continue;

    const latest = latestVersions.get(name);
    const current = manifest.overrides[name];
    if (typeof current !== "string" || !latest) continue;

    const rangePrefix = preserveRange && current.startsWith("^") ? "^" : "";
    const tildePrefix = preserveRange && current.startsWith("~") ? "~" : "";
    const next = `${rangePrefix}${tildePrefix}${latest}`;
    if (current !== next) {
      manifest.overrides[name] = next;
      changed = true;
    }
  }

  return changed;
}

function runPnpm(application, args) {
  console.log(`\n==> ${application.path}`);
  runCommand("pnpm", ["--dir", application.directory, "--ignore-workspace", ...args], {
    cwd: repoRoot,
    env: process.env,
  });
}

function findOverlayDirectories(templateDir) {
  const overlaysDir = join(templateDir, "overlays");
  if (!existsSync(overlaysDir)) return [];

  return readdirSync(overlaysDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => join(overlaysDir, entry.name))
    .filter((overlayDir) => existsSync(join(overlayDir, "manifest.json")))
    .sort();
}

function runNpmInstall(directory) {
  runCommand(
    "npm",
    [
      "install",
      "--package-lock-only",
      "--no-workspaces",
      "--ignore-scripts",
      "--no-audit",
      "--no-fund",
      "--progress=false",
    ],
    { cwd: directory },
  );
}

function refreshNpmLockfile(manifest, lockfilePath, label) {
  const temporaryDirectory = mkdtempSync(join(tmpdir(), "openui-lockfile-"));

  try {
    writeJson(join(temporaryDirectory, "package.json"), manifest);
    console.log(`\n==> ${label}`);
    runNpmInstall(temporaryDirectory);
    cpSync(join(temporaryDirectory, "package-lock.json"), lockfilePath);
  } finally {
    rmSync(temporaryDirectory, { recursive: true, force: true });
  }
}

function mergedOverlayManifest(templateManifest, overlayManifest, lockfile) {
  const manifest = structuredClone(templateManifest);
  const overlayPackageJson = overlayManifest.packageJson ?? {};
  const lockedPackage = lockfile.packages?.[""] ?? {};

  manifest.name =
    lockfile.name ?? lockedPackage.name ?? `${templateManifest.name}-${overlayManifest.label}`;
  manifest.version = lockfile.version ?? lockedPackage.version ?? templateManifest.version;
  manifest.dependencies ??= {};

  for (const dependency of overlayPackageJson.removeDependencies ?? []) {
    delete manifest.dependencies[dependency];
  }
  Object.assign(manifest.dependencies, overlayPackageJson.dependencies ?? {});
  Object.assign((manifest.devDependencies ??= {}), overlayPackageJson.devDependencies ?? {});
  Object.assign((manifest.scripts ??= {}), overlayPackageJson.scripts ?? {});

  return manifest;
}

function refreshOverlayLockfile(template, overlayDir) {
  const lockfilePath = join(overlayDir, "package-lock.json");
  const lockfile = existsSync(lockfilePath) ? readJson(lockfilePath) : {};
  const overlayManifest = readJson(join(overlayDir, "manifest.json"));
  const templateManifest = readJson(template.manifestPath);

  // A prior lockfile can contain peer constraints that are incompatible with
  // the newly updated base template. Start from the generated manifest so npm
  // resolves the new graph instead of rejecting the stale one.
  refreshNpmLockfile(
    mergedOverlayManifest(templateManifest, overlayManifest, lockfile),
    lockfilePath,
    `${relative(repoRoot, overlayDir)} lockfile`,
  );
}

function manageExamples() {
  const applications = findManifests(examplesRoot)
    .map(applicationFromManifest)
    .sort((left, right) => left.path.localeCompare(right.path));
  const versions = command === "update" ? latestOpenUIVersions(applications.map(({ manifest }) => manifest)) : new Map();

  for (const application of applications) {
    if (command === "install") {
      runPnpm(application, ["install", "--frozen-lockfile"]);
      continue;
    }

    if (command === "update") {
      const manifest = readJson(application.manifestPath);
      if (openUIDependencyNames(manifest).length > 0) {
        const applicationVersions = applicationOpenUIVersions(
          { ...application, manifest },
          versions,
        );
        if (pinOpenUIDependencyVersions(manifest, applicationVersions)) {
          writeJson(application.manifestPath, manifest);
        }
        runPnpm(application, ["install", "--lockfile-only", "--fix-lockfile"]);
        refreshNpmLockfile(
          manifest,
          join(application.directory, "package-lock.json"),
          `${application.path} npm lockfile`,
        );
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
}

function manageTemplates() {
  const templates = findManifests(templatesRoot)
    .map(applicationFromManifest)
    .filter((template) => !template.path.includes("/overlays/"))
    .sort((left, right) => left.path.localeCompare(right.path));
  const overlayManifests = templates.flatMap((template) =>
    findOverlayDirectories(template.directory).map((overlayDir) =>
      readJson(join(overlayDir, "manifest.json")).packageJson ?? {},
    ),
  );
  const versions = latestOpenUIVersions([
    ...templates.map(({ manifest }) => manifest),
    ...overlayManifests,
  ]);

  for (const template of templates) {
    const manifest = readJson(template.manifestPath);
    if (pinOpenUIDependencyVersions(manifest, versions, { preserveRange: true })) {
      writeJson(template.manifestPath, manifest);
    }

    for (const overlayDir of findOverlayDirectories(template.directory)) {
      const manifestPath = join(overlayDir, "manifest.json");
      const overlayManifest = readJson(manifestPath);
      if (
        overlayManifest.packageJson &&
        pinOpenUIDependencyVersions(overlayManifest.packageJson, versions, { preserveRange: true })
      ) {
        writeJson(manifestPath, overlayManifest);
      }
    }

    refreshNpmLockfile(
      manifest,
      join(template.directory, "package-lock.json"),
      `${template.path} lockfile`,
    );
    for (const overlayDir of findOverlayDirectories(template.directory)) {
      refreshOverlayLockfile(template, overlayDir);
    }
  }

  console.log(`\nUpdated ${templates.length} templates and their overlays.`);
}

if (target === "examples") {
  manageExamples();
} else {
  manageTemplates();
}
