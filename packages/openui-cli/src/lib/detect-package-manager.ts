import { execFileSync, execSync } from "node:child_process";

export type PackageManagerName = "pnpm" | "yarn" | "bun" | "npm";

export interface PackageManager {
  name: PackageManagerName;
  installCmd: string;
  installArgs: string[];
  runCmd: string;
}

const PACKAGE_MANAGERS: Record<PackageManagerName, PackageManager> = {
  pnpm: { name: "pnpm", installCmd: "pnpm install", installArgs: ["install"], runCmd: "pnpm" },
  yarn: { name: "yarn", installCmd: "yarn", installArgs: [], runCmd: "yarn" },
  bun: { name: "bun", installCmd: "bun install", installArgs: ["install"], runCmd: "bun" },
  npm: { name: "npm", installCmd: "npm install", installArgs: ["install"], runCmd: "npm" },
};

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

export function resolveInstallPackageManager(): PackageManager {
  const invoking = detectInvokingPackageManager();
  if (invoking === "pnpm" || invoking === "yarn" || invoking === "bun") {
    return PACKAGE_MANAGERS[invoking];
  }
  return isPnpmAvailable() ? PACKAGE_MANAGERS.pnpm : PACKAGE_MANAGERS.npm;
}

export function resolvePackageManagerVersion(name: PackageManagerName): string | undefined {
  try {
    return execFileSync(name, ["--version"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 2000,
    }).trim();
  } catch {
    return undefined;
  }
}
