import { execSync } from "node:child_process";

export type PackageManagerName = "pnpm" | "yarn" | "bun" | "npm";

export interface PackageManager {
  name: PackageManagerName;
  /** Installs all dependencies; run from the project directory. */
  installCmd: string;
  /** Runs a package script, e.g. `${runCmd} run dev`. */
  runCmd: string;
}

const PACKAGE_MANAGERS: Record<PackageManagerName, PackageManager> = {
  pnpm: { name: "pnpm", installCmd: "pnpm install", runCmd: "pnpm" },
  yarn: { name: "yarn", installCmd: "yarn", runCmd: "yarn" },
  bun: { name: "bun", installCmd: "bun install", runCmd: "bun" },
  npm: { name: "npm", installCmd: "npm install", runCmd: "npm" },
};

/**
 * The package manager the CLI was invoked with, read from the user-agent that
 * npm/pnpm/yarn/bun set on the processes they spawn. Returns null when nothing
 * recognizable is set (e.g. the binary was run directly).
 */
function detectInvokingPackageManager(): PackageManagerName | null {
  const userAgent = process.env["npm_config_user_agent"] ?? "";
  if (userAgent.startsWith("pnpm/")) return "pnpm";
  if (userAgent.startsWith("yarn/")) return "yarn";
  if (userAgent.startsWith("bun/")) return "bun";
  if (userAgent.startsWith("npm/")) return "npm";
  return null;
}

function isPnpmAvailable(): boolean {
  try {
    execSync("pnpm --version", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

/**
 * Resolve which package manager installs the scaffolded project.
 *
 * An explicit pnpm, yarn, or bun invocation is honored as-is. The npm/npx
 * default — and the case where no package manager is detected — is upgraded to
 * pnpm when it's installed, because pnpm's linked global store installs this
 * template far faster; it falls back to npm when pnpm is absent.
 */
export function resolveInstallPackageManager(): PackageManager {
  const invoking = detectInvokingPackageManager();
  if (invoking === "pnpm" || invoking === "yarn" || invoking === "bun") {
    return PACKAGE_MANAGERS[invoking];
  }
  return isPnpmAvailable() ? PACKAGE_MANAGERS.pnpm : PACKAGE_MANAGERS.npm;
}
