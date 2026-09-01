import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import type { PackageManagerName } from "./detect-package-manager";
import { checkoutSource } from "./checkout";
import { openUiSourceRoots } from "./featured-examples";
import type { ExampleProject } from "./projects";
import { CreateError } from "./telemetry";

const ARTIFACT_DIRS = new Set(["node_modules", ".next", ".turbo", "dist", ".nuxt", ".svelte-kit"]);

const GENERATE_SCRIPT_RE =
  /pnpm --filter @openuidev\/cli build && node (?:\.\.\/)+packages\/openui-cli\/dist\/index\.js generate/;
const GENERATE_SCRIPT_FALLBACK_RE =
  /node (?:\.\.\/)+packages\/openui-cli\/dist\/index\.js generate/;

function shouldCopyExamplePath(exampleDir: string, src: string): boolean {
  const relative = path.relative(exampleDir, src);
  if (!relative) return true;
  return !relative.split(path.sep).some((segment) => ARTIFACT_DIRS.has(segment));
}

function findLocalExampleDir(examplePath: string, sourceRoot?: string): string | undefined {
  for (const root of openUiSourceRoots(sourceRoot)) {
    const candidate = path.join(root, examplePath);
    if (fs.existsSync(path.join(candidate, "package.json"))) return candidate;
  }
  return undefined;
}

function collectPackageJsonFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ARTIFACT_DIRS.has(entry.name) || entry.name === ".git") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...collectPackageJsonFiles(full));
    else if (entry.name === "package.json") files.push(full);
  }
  return files;
}

function sortPackageRecord<T>(record: Record<string, T>): Record<string, T> {
  return Object.fromEntries(Object.entries(record).sort(([a], [b]) => a.localeCompare(b)));
}

function rewriteGenerateScript(value: string): string {
  if (GENERATE_SCRIPT_RE.test(value)) {
    return value.replace(GENERATE_SCRIPT_RE, "npx @openuidev/cli generate");
  }
  if (GENERATE_SCRIPT_FALLBACK_RE.test(value)) {
    return value.replace(GENERATE_SCRIPT_FALLBACK_RE, "npx @openuidev/cli generate");
  }
  return value;
}

function rewritePackageJsonFile(
  pkgPath: string,
  options: { name?: string; packageManager: PackageManagerName },
): void {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8")) as {
    name?: string;
    scripts?: Record<string, string>;
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    pnpm?: unknown;
  };
  if (options.name) pkg.name = options.name;
  if (options.packageManager !== "pnpm") delete pkg.pnpm;

  for (const section of ["dependencies", "devDependencies"] as const) {
    const deps = pkg[section];
    if (!deps) continue;
    for (const key of Object.keys(deps)) {
      const value = deps[key];
      if (!value) continue;
      if (value.startsWith("link:")) {
        const target = value.slice("link:".length);
        const abs = target.startsWith("~")
          ? path.join(os.homedir(), target.slice(1))
          : path.resolve(path.dirname(pkgPath), target);
        deps[key] = `file:${abs}`;
        continue;
      }
      if (/^(workspace:|file:|catalog:)/.test(value)) deps[key] = "latest";
    }
    pkg[section] = sortPackageRecord(deps);
  }

  if (pkg.scripts) {
    for (const [key, value] of Object.entries(pkg.scripts)) {
      pkg.scripts[key] = rewriteGenerateScript(value);
    }
  }

  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
}

function restoreDotfiles(projectDir: string) {
  const plain = path.join(projectDir, "gitignore");
  if (fs.existsSync(plain)) {
    fs.renameSync(plain, path.join(projectDir, ".gitignore"));
  }
}

function copyEnvExamples(projectDir: string): void {
  const mappings: Array<[string, string]> = [
    [".env.example", ".env"],
    [".env.local.example", ".env.local"],
    ["env.example", ".env"],
  ];

  const visit = (dir: string) => {
    for (const [fromName, toName] of mappings) {
      const from = path.join(dir, fromName);
      const to = path.join(dir, toName);
      if (fs.existsSync(from) && !fs.existsSync(to)) {
        fs.copyFileSync(from, to);
      }
    }
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory() || ARTIFACT_DIRS.has(entry.name)) continue;
      visit(path.join(dir, entry.name));
    }
  };

  visit(projectDir);
}

export async function scaffoldExample(params: {
  example: ExampleProject;
  targetDir: string;
  name: string;
  packageManager: PackageManagerName;
  sourceRoot?: string;
}): Promise<"local" | "github"> {
  const { example, targetDir, name, packageManager, sourceRoot } = params;
  const localDir = findLocalExampleDir(example.path, sourceRoot);

  try {
    if (localDir) {
      fs.cpSync(localDir, targetDir, {
        recursive: true,
        filter: (src) => shouldCopyExamplePath(localDir, src),
      });
    } else {
      await checkoutSource(example.path, { dest: targetDir });
    }
  } catch (err) {
    if (err instanceof CreateError) throw err;
    throw new CreateError(
      "scaffold",
      err instanceof Error ? err.message : String(err),
      "filesystem",
      "EXAMPLE_SCAFFOLD_FAILED",
    );
  }

  if (!fs.existsSync(path.join(targetDir, "package.json"))) {
    throw new CreateError(
      "scaffold",
      `Example "${example.name}" was not found at ${example.path}.`,
      "filesystem",
      "EXAMPLE_MISSING",
    );
  }

  restoreDotfiles(targetDir);

  const packageJsonFiles = collectPackageJsonFiles(targetDir);
  const rootPkg = path.join(targetDir, "package.json");
  for (const pkgPath of packageJsonFiles) {
    rewritePackageJsonFile(pkgPath, {
      name: pkgPath === rootPkg ? name : undefined,
      packageManager,
    });
  }

  writeWorkspaceIfNested(targetDir, packageJsonFiles, packageManager);
  copyEnvExamples(targetDir);
  return localDir ? "local" : "github";
}

function writeWorkspaceIfNested(
  projectDir: string,
  packageJsonFiles: string[],
  packageManager: PackageManagerName,
): void {
  const nested = packageJsonFiles
    .map((pkgPath) => path.relative(projectDir, path.dirname(pkgPath)))
    .filter((dir) => dir && dir !== ".");
  if (nested.length === 0) return;

  if (packageManager === "pnpm") {
    const yaml = `packages:\n${nested.map((dir) => `  - ${JSON.stringify(dir)}`).join("\n")}\n`;
    fs.writeFileSync(path.join(projectDir, "pnpm-workspace.yaml"), yaml);
    return;
  }

  const rootPkgPath = path.join(projectDir, "package.json");
  const pkg = JSON.parse(fs.readFileSync(rootPkgPath, "utf8")) as { workspaces?: string[] };
  pkg.workspaces = nested;
  fs.writeFileSync(rootPkgPath, JSON.stringify(pkg, null, 2) + "\n");
}

export function upsertEnvKey(
  projectDir: string,
  envFile: string,
  key: string,
  value: string,
): void {
  const filePath = path.join(projectDir, envFile);
  const existing = fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "";
  const line = `${key}=${value}`;
  if (existing.includes(`${key}=`)) {
    const next = existing.replace(new RegExp(`^${key}=.*$`, "m"), line);
    fs.writeFileSync(filePath, next.endsWith("\n") ? next : `${next}\n`);
    return;
  }
  const prefix = existing && !existing.endsWith("\n") ? `${existing}\n` : existing;
  fs.writeFileSync(filePath, `${prefix}${line}\n`);
}
