import * as fs from "node:fs";
import * as path from "node:path";

import {
  resolveDlxInvocation,
  resolveInstallPackageManager,
  type PackageManager,
} from "../detect-package-manager";
import { runCommand, type CommandResult } from "../process-runner";
import { CliCancelledError, CreateError, telemetry } from "../telemetry";
import { processErrorProperties } from "../utils";

/** Known OpenUI template env keys. Values are never logged or sent to telemetry. */
const ENV_ALLOWLIST = [
  "THESYS_API_KEY",
  "OPENAI_API_KEY",
  "OPENAI_BASE_URL",
  "OPENAI_MODEL",
  "APP_ID",
  "DEMO_USER_ID",
  "LANGGRAPH_API_URL",
  "LANGGRAPH_ASSISTANT_ID",
  "LANGSMITH_API_KEY",
] as const;

type TargetInvocation = {
  command: string;
  prefixArgs: string[];
  quietPrefixArgs: string[];
  source: "local" | "path" | "dlx";
};

export type DeployToVercelOptions = {
  projectDir: string;
  extraArgs: string[];
  prod: boolean;
  yes: boolean;
  skipEnv: boolean;
  noInteractive: boolean;
};

export async function deployToVercel(opts: DeployToVercelOptions): Promise<void> {
  const t0 = Date.now();
  const packageManager = resolveInstallPackageManager();
  const fileEnv = loadAllowlistedEnv(opts.projectDir);
  const localEnv = opts.skipEnv ? {} : fileEnv;
  warnMissingRequiredEnv(opts.projectDir, fileEnv);

  const vercel = resolveTargetCli(opts.projectDir, packageManager, "vercel");
  await prepareVercelCli(vercel, opts.projectDir);
  let loggedIn = await isVercelLoggedIn(vercel, opts.projectDir);
  if (!loggedIn) {
    await loginToVercel(vercel, opts);
    loggedIn = true;
  }

  const vercelArgs = buildVercelArgs({
    extraArgs: opts.extraArgs,
    yes: opts.yes,
    localEnv,
  });
  const publicArgs = vercelArgs.filter((_, i, args) => !isVercelEnvFlag(args, i));

  console.info(
    `Deploying to Vercel (${vercel.source}): ${formatDisplayedCommand(vercel, publicArgs)}`,
  );
  if (Object.keys(localEnv).length > 0) {
    console.info(
      `Passing local env to this deployment: ${Object.keys(localEnv).sort().join(", ")}`,
    );
  }
  console.info("");

  const result = await runCommand(
    vercel.command,
    [...vercel.quietPrefixArgs, ...vercelArgs],
    opts.projectDir,
    { inheritOutput: true },
  );
  if (!result.error && result.status === 0) {
    telemetry.capture("cli_deploy_succeeded", {
      target: "vercel",
      prod: opts.prod,
      yes: opts.yes,
      skip_env: opts.skipEnv,
      cli_source: vercel.source,
      logged_in: loggedIn,
      env_key_count: Object.keys(localEnv).length,
      duration_ms: Date.now() - t0,
    });
    return;
  }

  throwCommandFailure(result, "vercel_deploy", "Vercel deploy failed");
}

function resolveTargetCli(
  projectDir: string,
  packageManager: PackageManager,
  bin: string,
): TargetInvocation {
  const localUnix = path.join(projectDir, "node_modules", ".bin", bin);
  const localWin = `${localUnix}.cmd`;
  if (fs.existsSync(localWin)) {
    return { command: localWin, prefixArgs: [], quietPrefixArgs: [], source: "local" };
  }
  if (fs.existsSync(localUnix)) {
    return { command: localUnix, prefixArgs: [], quietPrefixArgs: [], source: "local" };
  }

  const fromPath = findExecutableOnPath(bin);
  if (fromPath) {
    return { command: fromPath, prefixArgs: [], quietPrefixArgs: [], source: "path" };
  }

  const dlx = resolveDlxInvocation(packageManager, bin);
  return {
    command: dlx.command,
    prefixArgs: dlx.args,
    quietPrefixArgs: dlx.quietArgs,
    source: "dlx",
  };
}

async function prepareVercelCli(invocation: TargetInvocation, cwd: string): Promise<void> {
  const preparing = invocation.source === "dlx";
  const tty = Boolean(process.stdout.isTTY);
  if (preparing) {
    const label = "Preparing Vercel CLI...";
    if (tty) process.stdout.write(label);
    else console.info(label);
  }

  const result = await runCommand(
    invocation.command,
    [...invocation.quietPrefixArgs, "--version"],
    cwd,
    { echo: false },
  );

  if (!result.error && result.status === 0) {
    if (preparing && tty) process.stdout.write(" done\n");
    return;
  }

  if (preparing && tty) process.stdout.write("\n");
  if (result.diagnosticTail) process.stderr.write(result.diagnosticTail);
  throwCommandFailure(
    result,
    preparing ? "vercel_cli_install" : "vercel_cli_version",
    preparing ? "Failed to install Vercel CLI" : "Failed to run Vercel CLI",
  );
}

async function isVercelLoggedIn(invocation: TargetInvocation, cwd: string): Promise<boolean> {
  const result = await runCommand(
    invocation.command,
    [...invocation.quietPrefixArgs, "--non-interactive", "whoami"],
    cwd,
    { echo: false, stdin: "ignore" },
  );
  return !result.error && result.status === 0;
}

async function loginToVercel(
  invocation: TargetInvocation,
  opts: Pick<DeployToVercelOptions, "projectDir" | "noInteractive">,
): Promise<void> {
  const canPrompt = Boolean(process.stdin.isTTY && process.stdout.isTTY) && !opts.noInteractive;
  if (!canPrompt) {
    throw new CreateError(
      "vercel_login",
      "Not logged into Vercel. Run `vercel login` or set VERCEL_TOKEN, then retry.",
      "authentication",
      "NOT_LOGGED_IN",
    );
  }

  console.info("Not logged into Vercel. Starting login...\n");
  const result = await runCommand(
    invocation.command,
    [...invocation.quietPrefixArgs, "login"],
    opts.projectDir,
    { inheritOutput: true },
  );
  if (!result.error && result.status === 0) return;
  throwCommandFailure(result, "vercel_login", "Vercel login failed");
}

function throwCommandFailure(result: CommandResult, stage: string, message: string): never {
  const properties = processErrorProperties(result, stage, {
    error_class: "process",
    error_code: "NONZERO_EXIT",
  });
  if (properties.error_class === "user_cancelled") {
    throw new CliCancelledError(stage, properties.cancellation_exit_code ?? 0, properties);
  }
  const { failure_stage, error_class, error_code, ...metadata } = properties;
  throw new CreateError(failure_stage, message, error_class, error_code, metadata);
}

function findExecutableOnPath(bin: string): string | undefined {
  const pathEnv = process.env["PATH"] ?? "";
  const extensions = process.platform === "win32" ? [".cmd", ".exe", ".bat", ""] : [""];
  for (const dir of pathEnv.split(path.delimiter)) {
    if (!dir) continue;
    for (const ext of extensions) {
      const candidate = path.join(dir, bin + ext);
      try {
        fs.accessSync(candidate, fs.constants.X_OK);
        return candidate;
      } catch {
        /* not executable / missing */
      }
    }
  }
  return undefined;
}

function buildVercelArgs(opts: {
  extraArgs: string[];
  yes: boolean;
  localEnv: Record<string, string>;
}): string[] {
  const args = [...opts.extraArgs];
  if (opts.yes && !args.includes("--yes") && !args.includes("-y")) args.unshift("--yes");

  const envKeys = vercelEnvKeysInArgs(args, ["--env", "-e"]);
  const buildEnvKeys = vercelEnvKeysInArgs(args, ["--build-env", "-b"]);
  for (const key of Object.keys(opts.localEnv).sort()) {
    const value = opts.localEnv[key];
    if (value === undefined) continue;
    const assignment = `${key}=${value}`;
    // Next.js inlines process.env at `next build`. Runtime `--env` alone is
    // not enough — the remote build also needs `--build-env`.
    if (!envKeys.has(key)) args.push("--env", assignment);
    if (!buildEnvKeys.has(key)) args.push("--build-env", assignment);
  }
  return args;
}

function vercelEnvKeysInArgs(
  args: string[],
  flags: readonly string[] = ["--env", "-e", "--build-env", "-b"],
): Set<string> {
  const keys = new Set<string>();
  const flagSet = new Set(flags);
  const prefixed = new RegExp(
    `^(?:${flags.map((flag) => flag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})=(.+)$`,
  );
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]!;
    if (flagSet.has(arg)) {
      const assignment = args[i + 1];
      const key = assignment?.split("=")[0];
      if (key) keys.add(key);
      i += 1;
      continue;
    }
    const match = arg.match(prefixed);
    if (match?.[1]) keys.add(match[1].split("=")[0]!);
  }
  return keys;
}

function isVercelEnvFlag(args: string[], index: number): boolean {
  const arg = args[index]!;
  if (arg === "--env" || arg === "-e" || arg === "--build-env" || arg === "-b") return true;
  if (/^(?:--env|-e|--build-env|-b)=/.test(arg)) return true;
  const prev = args[index - 1];
  return prev === "--env" || prev === "-e" || prev === "--build-env" || prev === "-b";
}

function loadAllowlistedEnv(projectDir: string): Record<string, string> {
  const merged = {
    ...parseEnvFile(path.join(projectDir, ".env")),
    ...parseEnvFile(path.join(projectDir, ".env.local")),
  };
  const allowlisted: Record<string, string> = {};
  for (const key of ENV_ALLOWLIST) {
    const value = merged[key]?.trim();
    if (value) allowlisted[key] = value;
  }
  return allowlisted;
}

function parseEnvFile(filePath: string): Record<string, string> {
  if (!fs.existsSync(filePath)) return {};
  const out: Record<string, string> = {};
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

function warnMissingRequiredEnv(projectDir: string, localEnv: Record<string, string>): void {
  for (const key of detectRequiredEnvNames(projectDir)) {
    if (localEnv[key] || process.env[key]?.trim()) continue;
    console.info(
      `⚠ ${key} is not set locally. This deployment will fail at runtime unless ${key} is already configured on Vercel.\n`,
    );
  }
}

function detectRequiredEnvNames(projectDir: string): string[] {
  const pkgPath = path.join(projectDir, "package.json");
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8")) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  if (deps["@openuidev/thesys-server"] || deps["@openuidev/thesys"]) return ["THESYS_API_KEY"];
  if (deps["openai"] || deps["ai"] || deps["@ai-sdk/openai"]) return ["OPENAI_API_KEY"];
  return [];
}

function formatDisplayedCommand(invocation: TargetInvocation, publicArgs: string[]): string {
  const binName = path.basename(invocation.command).replace(/\.cmd$/i, "");
  const head =
    invocation.source === "dlx" ? [invocation.command, ...invocation.prefixArgs] : [binName];
  return [...head, ...publicArgs].join(" ");
}
