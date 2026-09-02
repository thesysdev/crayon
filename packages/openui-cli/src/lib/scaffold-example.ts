import * as fs from "node:fs";
import * as path from "node:path";

import { checkoutSource } from "./checkout";
import type { PackageManagerName } from "./detect-package-manager";
import type { ExampleProject } from "./projects";
import {
  pruneScaffoldLockfiles,
  restoreDotfiles,
  rewriteScaffoldPackageJson,
} from "./scaffold-package";
import { CreateError } from "./telemetry";

const ARTIFACT_DIRS = new Set(["node_modules", ".next", ".turbo", "dist", ".nuxt", ".svelte-kit"]);

const GENERATE_SCRIPT_RE =
  /pnpm --filter @openuidev\/cli build && node (?:\.\.\/)+packages\/openui-cli\/dist\/index\.js generate/;
const GENERATE_SCRIPT_FALLBACK_RE =
  /node (?:\.\.\/)+packages\/openui-cli\/dist\/index\.js generate/;

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

function rewriteGenerateScript(value: string): string {
  if (GENERATE_SCRIPT_RE.test(value)) {
    return value.replace(GENERATE_SCRIPT_RE, "npx @openuidev/cli generate");
  }
  if (GENERATE_SCRIPT_FALLBACK_RE.test(value)) {
    return value.replace(GENERATE_SCRIPT_FALLBACK_RE, "npx @openuidev/cli generate");
  }
  return value;
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
}): Promise<void> {
  const { example, targetDir, name, packageManager } = params;

  try {
    await checkoutSource(example.path, { dest: targetDir });
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
    rewriteScaffoldPackageJson({
      pkgPath,
      name: pkgPath === rootPkg ? name : undefined,
      packageManager,
      rewriteScript: rewriteGenerateScript,
    });
  }

  writeWorkspaceIfNested(targetDir, packageJsonFiles, packageManager);
  copyEnvExamples(targetDir);
  pruneScaffoldLockfiles(targetDir, packageManager, { keepPnpmWorkspace: true });
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
