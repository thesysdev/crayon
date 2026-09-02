import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import type { PackageManagerName } from "./detect-package-manager";

type ScaffoldPackageJson = {
  name?: string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  pnpm?: unknown;
};

export type ScaffoldPackageJsonPatch = {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
  removeDependencies?: string[];
};

/** Match npm/pnpm install: keep dependency keys alphabetically sorted. */
function sortPackageRecord<T>(record: Record<string, T>): Record<string, T> {
  return Object.fromEntries(Object.entries(record).sort(([a], [b]) => a.localeCompare(b)));
}

function rewritePublishedDependency(value: string, pkgDir: string): string {
  if (value.startsWith("link:")) {
    const target = value.slice("link:".length);
    const abs = target.startsWith("~")
      ? path.join(os.homedir(), target.slice(1))
      : path.resolve(pkgDir, target);
    return `file:${abs}`;
  }
  // workspace:/file:/catalog: are monorepo-only protocols npm/yarn/bun
  // can't resolve standalone — pin them to the published "latest".
  if (/^(workspace:|file:|catalog:)/.test(value)) return "latest";
  return value;
}

/**
 * Templates ship `gitignore` un-dotted: npm silently strips `.gitignore`
 * files (at any depth) from published packages, so a dotted copy never
 * reaches the scaffold — and freshly created apps would commit `.env`.
 */
export function restoreDotfiles(projectDir: string): void {
  const plain = path.join(projectDir, "gitignore");
  if (fs.existsSync(plain)) {
    fs.renameSync(plain, path.join(projectDir, ".gitignore"));
  }
}

export function rewriteScaffoldPackageJson(options: {
  pkgPath: string;
  name?: string;
  packageManager: PackageManagerName;
  overlayPackageJson?: ScaffoldPackageJsonPatch;
  rewriteScript?: (value: string) => string;
}): ScaffoldPackageJson {
  const pkg = JSON.parse(fs.readFileSync(options.pkgPath, "utf8")) as ScaffoldPackageJson;
  if (options.name) pkg.name = options.name;
  if (options.packageManager !== "pnpm") delete pkg.pnpm;

  if (options.overlayPackageJson) {
    pkg.dependencies ??= {};
    for (const dependency of options.overlayPackageJson.removeDependencies ?? []) {
      delete pkg.dependencies[dependency];
    }
    Object.assign(pkg.dependencies, options.overlayPackageJson.dependencies ?? {});
    Object.assign((pkg.devDependencies ??= {}), options.overlayPackageJson.devDependencies ?? {});
    Object.assign((pkg.scripts ??= {}), options.overlayPackageJson.scripts ?? {});
  }

  const pkgDir = path.dirname(options.pkgPath);
  for (const section of ["dependencies", "devDependencies"] as const) {
    const deps = pkg[section];
    if (!deps) continue;
    for (const key of Object.keys(deps)) {
      const value = deps[key];
      if (!value) continue;
      deps[key] = rewritePublishedDependency(value, pkgDir);
    }
    pkg[section] = sortPackageRecord(deps);
  }

  if (options.rewriteScript && pkg.scripts) {
    for (const [key, value] of Object.entries(pkg.scripts)) {
      pkg.scripts[key] = options.rewriteScript(value);
    }
  }

  fs.writeFileSync(options.pkgPath, JSON.stringify(pkg, null, 2) + "\n");
  return pkg;
}

/** Keep a copied npm lockfile's root metadata aligned so `npm ci` can consume it. */
export function syncNpmLockRoot(
  projectDir: string,
  name: string,
  pkg: Pick<ScaffoldPackageJson, "dependencies" | "devDependencies">,
): void {
  const lockPath = path.join(projectDir, "package-lock.json");
  if (!fs.existsSync(lockPath)) return;

  const lock = JSON.parse(fs.readFileSync(lockPath, "utf8")) as {
    name?: string;
    packages?: Record<
      string,
      {
        name?: string;
        dependencies?: Record<string, string>;
        devDependencies?: Record<string, string>;
      }
    >;
  };
  lock.name = name;
  const lockRoot = lock.packages?.[""];
  if (lockRoot) {
    lockRoot.name = name;
    lockRoot.dependencies = pkg.dependencies;
    lockRoot.devDependencies = pkg.devDependencies;
  }
  fs.writeFileSync(lockPath, JSON.stringify(lock, null, 2) + "\n");
}

export function pruneScaffoldLockfiles(
  targetDir: string,
  packageManager: PackageManagerName,
  options: {
    keepNpmLock?: boolean;
    keepPnpmLock?: boolean;
    keepPnpmWorkspace?: boolean;
  } = {},
): void {
  const keepNpmLock = options.keepNpmLock ?? packageManager === "npm";
  const keepPnpmLock = options.keepPnpmLock ?? packageManager === "pnpm";
  const keepPnpmWorkspace = options.keepPnpmWorkspace ?? packageManager === "pnpm";
  if (!keepNpmLock) fs.rmSync(path.join(targetDir, "package-lock.json"), { force: true });
  if (!keepPnpmLock) fs.rmSync(path.join(targetDir, "pnpm-lock.yaml"), { force: true });
  if (!keepPnpmWorkspace) fs.rmSync(path.join(targetDir, "pnpm-workspace.yaml"), { force: true });
}
