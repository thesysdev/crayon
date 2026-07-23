import { spawnSync } from "node:child_process";

import { resolveCommandInvocation } from "./command-invocation";

export type PackageManagerName = "pnpm" | "yarn" | "bun" | "npm";

export interface PackageManager {
  name: PackageManagerName;
  installCmd: string;
  installArgs: readonly string[];
  runCmd: string;
}

const PACKAGE_MANAGERS: Record<PackageManagerName, PackageManager> = {
  pnpm: { name: "pnpm", installCmd: "pnpm install", installArgs: ["install"], runCmd: "pnpm" },
  yarn: { name: "yarn", installCmd: "yarn", installArgs: [], runCmd: "yarn" },
  bun: { name: "bun", installCmd: "bun install", installArgs: ["install"], runCmd: "bun" },
  npm: { name: "npm", installCmd: "npm install", installArgs: ["install"], runCmd: "npm" },
};
const packageManagerVersionCache = new Map<PackageManagerName, string | undefined>();

function detectInvokingPackageManager(): PackageManagerName | null {
  const userAgent = process.env["npm_config_user_agent"] ?? "";
  if (userAgent.startsWith("pnpm/")) return "pnpm";
  if (userAgent.startsWith("yarn/")) return "yarn";
  if (userAgent.startsWith("bun/")) return "bun";
  if (userAgent.startsWith("npm/")) return "npm";
  return null;
}

function isPnpmAvailable(): boolean {
  return getPackageManagerVersion("pnpm") !== undefined;
}

export function getPackageManagerVersion(packageManager: PackageManagerName): string | undefined {
  if (packageManagerVersionCache.has(packageManager)) {
    return packageManagerVersionCache.get(packageManager);
  }
  const invocation = resolveCommandInvocation(packageManager, ["--version"]);
  const result = spawnSync(invocation.command, invocation.args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
    timeout: 5000,
  });
  if (result.status !== 0) {
    packageManagerVersionCache.set(packageManager, undefined);
    return undefined;
  }

  const version = normalizePackageManagerVersion(result.stdout ?? "");
  packageManagerVersionCache.set(packageManager, version);
  return version;
}

export function normalizePackageManagerVersion(output: string): string | undefined {
  const version = output.trim();
  // Version output is expected to be a short semver-like token. Drop anything
  // unexpected instead of forwarding arbitrary command output to telemetry.
  return version.length <= 64 &&
    /^v?\d+(?:\.\d+){0,3}(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(version)
    ? version
    : undefined;
}

export function resolveInstallPackageManager(): PackageManager {
  const invoking = detectInvokingPackageManager();
  if (invoking === "pnpm" || invoking === "yarn" || invoking === "bun") {
    return PACKAGE_MANAGERS[invoking];
  }
  return isPnpmAvailable() ? PACKAGE_MANAGERS.pnpm : PACKAGE_MANAGERS.npm;
}
