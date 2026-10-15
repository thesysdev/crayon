export type PackageManagerName = "pnpm" | "yarn" | "bun" | "npm";

export interface PackageManager {
  name: PackageManagerName;
  installCmd: string;
  installArgs: string[];
  runCmd: string;
  dlxCmd: string;
}

const PACKAGE_MANAGERS: Record<PackageManagerName, PackageManager> = {
  pnpm: {
    name: "pnpm",
    installCmd: "pnpm install",
    installArgs: ["install"],
    runCmd: "pnpm",
    dlxCmd: "pnpm dlx",
  },
  yarn: {
    name: "yarn",
    installCmd: "yarn",
    installArgs: [],
    runCmd: "yarn",
    dlxCmd: "yarn dlx",
  },
  bun: {
    name: "bun",
    installCmd: "bun install",
    installArgs: ["install"],
    runCmd: "bun",
    dlxCmd: "bunx",
  },
  npm: {
    name: "npm",
    installCmd: "npm ci --prefer-offline --no-audit --no-fund --progress=false",
    installArgs: ["ci", "--prefer-offline", "--no-audit", "--no-fund", "--progress=false"],
    runCmd: "npm",
    dlxCmd: "npx",
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
  const pm = PACKAGE_MANAGERS[invoking ?? "npm"];
  // Yarn 1 has no `dlx`; npx is what its users run instead.
  const yarnClassic = (process.env["npm_config_user_agent"] ?? "").startsWith("yarn/1.");
  return yarnClassic ? { ...pm, dlxCmd: "npx" } : pm;
}

/** Run a published CLI through npm's Node-compatible executor. */
export function resolveDlxInvocation(pkg: string): {
  command: string;
  args: string[];
  quietArgs: string[];
} {
  return {
    command: "npx",
    args: ["--yes", pkg],
    quietArgs: ["--yes", "--quiet", pkg],
  };
}
