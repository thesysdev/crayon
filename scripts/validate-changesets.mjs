import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const baseArg = process.argv.find((argument) => argument.startsWith("--base="));
const baseRef = baseArg?.slice("--base=".length) || process.env.CHANGESET_BASE_REF || "origin/main";
const isGeneratedReleasePr = process.env.CHANGESET_RELEASE_PR?.toLowerCase() === "true";

function git(args, options = {}) {
  return execFileSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    ...options,
  }).trim();
}

function lines(value) {
  return value ? value.split(/\r?\n/).filter(Boolean) : [];
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function packageManifestAt(packageDirectory, mergeBase) {
  const currentPath = join(repoRoot, packageDirectory, "package.json");
  if (existsSync(currentPath)) {
    return readJson(currentPath);
  }

  try {
    return JSON.parse(git(["show", `${mergeBase}:${packageDirectory}/package.json`]));
  } catch {
    return null;
  }
}

function getWorkingTreeFiles() {
  const modified = lines(git(["diff", "--name-only", "HEAD"]));
  const untracked = lines(git(["ls-files", "--others", "--exclude-standard"]));
  return [...modified, ...untracked];
}

function parseChangeset(path) {
  const contents = readFileSync(path, "utf8");
  const sourceLines = contents.split(/\r?\n/);
  const closingDelimiter = sourceLines.indexOf("---", 1);
  if (sourceLines[0] !== "---" || closingDelimiter === -1) {
    throw new Error(`${relative(repoRoot, path)} does not contain Changesets frontmatter`);
  }

  const frontmatter = sourceLines.slice(1, closingDelimiter).join("\n").trim();
  if (!frontmatter) {
    return { empty: true, releases: new Map() };
  }

  const releases = new Map();
  for (const sourceLine of frontmatter.split(/\r?\n/)) {
    const source = sourceLine.trim();
    if (!source || source.startsWith("#")) {
      continue;
    }

    const entry = source.match(
      /^(?:"([^"]+)"|'([^']+)'|([^:#][^:]*?))\s*:\s*(patch|minor|major)\s*$/,
    );
    if (!entry) {
      throw new Error(
        `Cannot read release entry ${JSON.stringify(sourceLine)} in ${relative(repoRoot, path)}`,
      );
    }

    const packageName = (entry[1] || entry[2] || entry[3]).trim();
    if (releases.has(packageName)) {
      throw new Error(`${relative(repoRoot, path)} declares ${packageName} more than once`);
    }
    releases.set(packageName, entry[4]);
  }

  return { empty: releases.size === 0, releases };
}

let mergeBase;
try {
  mergeBase = git(["merge-base", baseRef, "HEAD"]);
} catch (error) {
  console.error(
    `Unable to find a merge base for ${baseRef}. Fetch the full base branch history first.`,
  );
  console.error(error.stderr?.toString().trim() || error.message);
  process.exit(1);
}

const committedFiles = lines(
  git(["diff", "--name-only", "--diff-filter=ACMR", `${mergeBase}...HEAD`]),
);
const changedFiles = new Set([...committedFiles, ...getWorkingTreeFiles()]);

const currentPackageDirectories = readdirSync(join(repoRoot, "packages"), {
  withFileTypes: true,
})
  .filter((entry) => entry.isDirectory())
  .map((entry) => `packages/${entry.name}`);

const changedPackageDirectories = [...changedFiles]
  .filter((path) => path.startsWith("packages/"))
  .map((path) => path.split("/").slice(0, 2).join("/"));

const packageDirectories = new Set([...currentPackageDirectories, ...changedPackageDirectories]);
const publicPackagesByDirectory = new Map();
const publicPackageNames = new Set();

for (const packageDirectory of packageDirectories) {
  const manifest = packageManifestAt(packageDirectory, mergeBase);
  if (!manifest || manifest.private === true || !manifest.name) {
    continue;
  }
  publicPackagesByDirectory.set(packageDirectory, manifest.name);
  publicPackageNames.add(manifest.name);
}

const changedPublicPackages = new Set();
for (const packageDirectory of changedPackageDirectories) {
  const packageName = publicPackagesByDirectory.get(packageDirectory);
  if (packageName) {
    changedPublicPackages.add(packageName);
  }
}

const changesetFiles = [...changedFiles]
  .filter(
    (path) =>
      path.startsWith(".changeset/") &&
      path.endsWith(".md") &&
      path !== ".changeset/README.md" &&
      existsSync(join(repoRoot, path)),
  )
  .sort();

const declaredReleases = new Map();
const emptyChangesets = [];
const validationErrors = [];

for (const changesetFile of changesetFiles) {
  try {
    const parsed = parseChangeset(join(repoRoot, changesetFile));
    if (parsed.empty) {
      emptyChangesets.push(changesetFile);
      continue;
    }

    for (const [packageName, bump] of parsed.releases) {
      if (!publicPackageNames.has(packageName)) {
        validationErrors.push(
          `${changesetFile} declares unknown or private package ${packageName}`,
        );
        continue;
      }
      declaredReleases.set(packageName, bump);
    }
  } catch (error) {
    validationErrors.push(error.message);
  }
}

if (isGeneratedReleasePr) {
  console.log(
    "Generated Changesets release PR detected; package-change presence enforcement is skipped.",
  );
  if (validationErrors.length) {
    console.error(validationErrors.map((error) => `- ${error}`).join("\n"));
    process.exit(1);
  }
  process.exit(0);
}

if (emptyChangesets.length && declaredReleases.size) {
  validationErrors.push(
    "An empty no-release changeset cannot be combined with package release entries in the same contribution.",
  );
}

const hasNoReleaseException = emptyChangesets.length > 0 && declaredReleases.size === 0;

if (changedPublicPackages.size > 0 && declaredReleases.size === 0 && !hasNoReleaseException) {
  validationErrors.push(
    "Published package files changed, but this contribution adds neither package release entries nor an empty no-release changeset.",
  );
}

if (!hasNoReleaseException) {
  for (const packageName of [...changedPublicPackages].sort()) {
    if (!declaredReleases.has(packageName)) {
      validationErrors.push(
        `${packageName} has changed files but is missing from the new changesets.`,
      );
    }
  }

  const bundleSources = ["@openuidev/react-ui", "@openuidev/react-lang"].filter((packageName) =>
    declaredReleases.has(packageName),
  );

  if (bundleSources.length > 0 && !declaredReleases.has("@openuidev/browser-bundle")) {
    validationErrors.push(
      `${bundleSources.join(" and ")} has a release entry, so @openuidev/browser-bundle must also have an explicit release entry for its compiled output.`,
    );
  }
}

if (validationErrors.length) {
  console.error("Changeset coverage validation failed:\n");
  console.error(validationErrors.map((error) => `- ${error}`).join("\n"));
  console.error(
    "\nRun `pnpm changeset` to declare releases or `pnpm changeset --empty` for a reviewed no-release exception.",
  );
  process.exit(1);
}

if (hasNoReleaseException) {
  console.log(
    `No-release exception recorded by ${emptyChangesets.join(", ")} for changed packages: ${[...changedPublicPackages].sort().join(", ") || "none"}.`,
  );
} else {
  console.log(
    `Changeset coverage is complete for changed packages: ${[...changedPublicPackages].sort().join(", ") || "none"}.`,
  );
}

if (declaredReleases.size) {
  console.log(
    `Declared releases: ${[...declaredReleases]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([packageName, bump]) => `${packageName} (${bump})`)
      .join(", ")}.`,
  );
}
