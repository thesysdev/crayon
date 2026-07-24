import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const packagesRoot = join(repoRoot, "packages");
const pnpmCommand = process.platform === "win32" ? "pnpm.cmd" : "pnpm";

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function collectPublishablePackages() {
  return readdirSync(packagesRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const directory = join(packagesRoot, entry.name);
      const manifestPath = join(directory, "package.json");
      if (!existsSync(manifestPath)) {
        return null;
      }
      return { directory, manifest: readJson(manifestPath) };
    })
    .filter((entry) => entry && entry.manifest.private !== true && entry.manifest.name)
    .sort((left, right) => left.manifest.name.localeCompare(right.manifest.name));
}

function allStringValues(value, output = []) {
  if (typeof value === "string") {
    output.push(value);
  } else if (Array.isArray(value)) {
    for (const item of value) {
      allStringValues(item, output);
    }
  } else if (value && typeof value === "object") {
    for (const item of Object.values(value)) {
      allStringValues(item, output);
    }
  }
  return output;
}

function dependencyEntries(manifest) {
  return [
    ...Object.entries(manifest.dependencies || {}),
    ...Object.entries(manifest.optionalDependencies || {}),
    ...Object.entries(manifest.peerDependencies || {}),
  ];
}

function packPackage(packageEntry, archiveDirectory) {
  const before = new Set(readdirSync(archiveDirectory));
  const result = spawnSync(pnpmCommand, ["pack", "--pack-destination", archiveDirectory], {
    cwd: packageEntry.directory,
    encoding: "utf8",
    env: {
      ...process.env,
      npm_config_ignore_scripts: "true",
    },
  });

  if (result.status !== 0) {
    throw new Error(
      `Packing ${packageEntry.manifest.name} failed:\n${result.stdout}${result.stderr}`,
    );
  }

  const created = readdirSync(archiveDirectory).filter(
    (file) => !before.has(file) && file.endsWith(".tgz"),
  );
  if (created.length !== 1) {
    throw new Error(
      `Expected one archive for ${packageEntry.manifest.name}, found ${created.length}`,
    );
  }
  return join(archiveDirectory, created[0]);
}

function archiveContents(archivePath) {
  return execFileSync("tar", ["-tzf", archivePath], {
    encoding: "utf8",
    env: { ...process.env, LANG: "C", LC_ALL: "C" },
  })
    .trim()
    .split(/\r?\n/)
    .filter(Boolean)
    .map((entry) => entry.replace(/\/$/, ""));
}

function packedManifest(archivePath) {
  return JSON.parse(
    execFileSync("tar", ["-xOf", archivePath, "package/package.json"], {
      encoding: "utf8",
      env: { ...process.env, LANG: "C", LC_ALL: "C" },
    }),
  );
}

function assertArchive(packageEntry, archivePath) {
  const expected = packageEntry.manifest;
  const packed = packedManifest(archivePath);
  const files = new Set(archiveContents(archivePath));
  const errors = [];

  if (packed.name !== expected.name || packed.version !== expected.version) {
    errors.push(
      `identity is ${packed.name}@${packed.version}, expected ${expected.name}@${expected.version}`,
    );
  }

  for (const [dependencyName, range] of dependencyEntries(packed)) {
    if (range.startsWith("workspace:")) {
      errors.push(`${dependencyName} still has unresolved workspace range ${range}`);
    }
  }

  for (const includedPath of expected.files || []) {
    const archivePrefix = `package/${includedPath.replace(/\/$/, "")}`;
    const isPresent = [...files].some(
      (file) => file === archivePrefix || file.startsWith(`${archivePrefix}/`),
    );
    if (!isPresent) {
      errors.push(`files entry ${includedPath} is absent from the archive`);
    }
  }

  const entrypoints = [
    packed.main,
    packed.module,
    packed.types,
    ...allStringValues(packed.bin),
    ...allStringValues(packed.exports),
  ].filter(
    (entrypoint) =>
      typeof entrypoint === "string" && entrypoint.startsWith("./") && !entrypoint.includes("*"),
  );

  for (const entrypoint of new Set(entrypoints)) {
    const archivePathForEntrypoint = `package/${entrypoint.slice(2)}`;
    if (!files.has(archivePathForEntrypoint)) {
      errors.push(`entry point ${entrypoint} is absent from the archive`);
    }
  }

  if (expected.name === "@openuidev/cli") {
    for (const template of ["openui-cloud", "openui-self-hosted"]) {
      const templateManifest = `package/dist/templates/${template}/package.json`;
      if (!files.has(templateManifest)) {
        errors.push(`generated CLI template ${template} is absent`);
      }
    }
  }

  if (expected.name === "@openuidev/browser-bundle") {
    for (const artifact of [
      "package/dist/openui-bundle.min.js",
      "package/dist/openui-styles.css",
    ]) {
      if (!files.has(artifact)) {
        errors.push(`browser bundle artifact ${artifact} is absent`);
      }
    }
  }

  if (errors.length) {
    throw new Error(
      `${expected.name}@${expected.version} archive is invalid:\n${errors
        .map((error) => `  - ${error}`)
        .join("\n")}`,
    );
  }

  console.log(`✓ ${expected.name}@${expected.version}: ${files.size} archive entries`);
}

const publishablePackages = collectPublishablePackages();
const archiveDirectory = mkdtempSync(join(tmpdir(), "openui-release-archives-"));

try {
  for (const packageEntry of publishablePackages) {
    const archivePath = packPackage(packageEntry, archiveDirectory);
    assertArchive(packageEntry, archivePath);
  }

  console.log(`Inspected ${publishablePackages.length} package archives successfully.`);
} finally {
  rmSync(archiveDirectory, { recursive: true, force: true });
}
