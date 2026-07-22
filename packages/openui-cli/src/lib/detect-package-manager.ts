export type PackageManagerName = "pnpm" | "yarn" | "bun" | "npm";

export interface PackageManager {
  name: PackageManagerName;
  installCmd: string;
  runCmd: string;
}

const PACKAGE_MANAGERS: Record<PackageManagerName, PackageManager> = {
  pnpm: { name: "pnpm", installCmd: "pnpm install", runCmd: "pnpm" },
  yarn: { name: "yarn", installCmd: "yarn", runCmd: "yarn" },
  bun: { name: "bun", installCmd: "bun install", runCmd: "bun" },
  npm: {
    name: "npm",
    installCmd: "npm ci --prefer-offline --no-audit --no-fund --progress=false",
    runCmd: "npm",
  },
};

function detectInvokingPackageManager(): PackageManagerName | null {
  const userAgent = process.env["npm_config_user_agent"] ?? "";
  if (userAgent.startsWith("pnpm/")) return "pnpm";
  if (userAgent.startsWith("yarn/")) return "yarn";
  if (userAgent.startsWith("bun/")) return "bun";
  if (userAgent.startsWith("npm/")) return "npm";
  return null;
}

export function resolveInstallPackageManager(): PackageManager {
  const invoking = detectInvokingPackageManager();
  return PACKAGE_MANAGERS[invoking ?? "npm"];
}
