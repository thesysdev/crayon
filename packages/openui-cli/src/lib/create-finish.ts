import * as fs from "node:fs";
import * as path from "node:path";

import { QUIET_COMMAND_CAPTURE_LIMIT } from "./command-output";
import { runDependencyInstall, withProgress } from "./create-helpers";
import { createFunnelProps } from "./create-telemetry";
import type { PackageManager } from "./detect-package-manager";
import { runDevCommand } from "./dev-server";
import { runSkillInstall } from "./install-skill";
import { CliCancelledError, CreateError, telemetry } from "./telemetry";
import { processErrorProperties } from "./utils";

export function resolveScaffoldInstall(
  packageManager: PackageManager,
  targetDir: string,
  unlocked: boolean,
): { installCmd: string; installArgs: string[] } {
  if (!unlocked) {
    return { installCmd: packageManager.installCmd, installArgs: packageManager.installArgs };
  }
  const hasNpmLock = fs.existsSync(path.join(targetDir, "package-lock.json"));
  if (packageManager.name === "npm" && !hasNpmLock) {
    return {
      installCmd: "npm install --no-audit --no-fund --progress=false",
      installArgs: ["install", "--no-audit", "--no-fund", "--progress=false"],
    };
  }
  if (packageManager.name === "pnpm") {
    return {
      installCmd: "pnpm install --no-frozen-lockfile",
      installArgs: ["install", "--no-frozen-lockfile"],
    };
  }
  return { installCmd: packageManager.installCmd, installArgs: packageManager.installArgs };
}

export async function runScaffoldDependencyInstall(params: {
  verbose?: boolean;
  packageManager: PackageManager;
  targetDir: string;
  unlockedInstall: boolean;
  installDependencies: boolean;
  telemetryProps?: Record<string, unknown>;
}): Promise<{ dependencyInstalled: boolean; installCmd: string }> {
  const { installCmd, installArgs } = resolveScaffoldInstall(
    params.packageManager,
    params.targetDir,
    params.unlockedInstall,
  );
  const extra = params.telemetryProps ?? {};

  if (!params.installDependencies) {
    telemetry.capture("cli_dependency_install_skipped", {
      skip_reason: "no_install_flag",
    });
    console.info(`Skipping dependency install (--no-install). Run \`${installCmd}\` later.`);
    return { dependencyInstalled: false, installCmd };
  }

  telemetry.capture("cli_dependency_install_started", {
    ...createFunnelProps("dependency_install_started"),
    ...extra,
  });
  const installResult = await runDependencyInstall({
    verbose: params.verbose,
    command: params.packageManager.runCmd,
    args: installArgs,
    cwd: params.targetDir,
    installCmd,
  });
  if (!installResult.error && installResult.status === 0) {
    telemetry.capture("cli_dependency_install_succeeded", {
      ...createFunnelProps("dependency_install_succeeded"),
      ...extra,
      dependency_installed: true,
    });
    return { dependencyInstalled: true, installCmd };
  }

  const properties = processErrorProperties(installResult, "dependency_install", {
    error_class: "dependency",
    error_code: "NONZERO_EXIT",
  });
  if (properties.error_class === "user_cancelled") {
    telemetry.capture("cli_dependency_install_cancelled", {
      ...createFunnelProps("dependency_install_cancelled"),
      ...extra,
      dependency_installed: false,
      ...properties,
    });
    throw new CliCancelledError(
      "dependency_install",
      properties.cancellation_exit_code ?? 0,
      properties,
    );
  }
  telemetry.capture("cli_dependency_install_failed", {
    ...createFunnelProps("dependency_install_failed"),
    ...extra,
    dependency_installed: false,
    ...properties,
  });
  const { failure_stage, error_class, error_code, ...metadata } = properties;
  throw new CreateError(
    failure_stage,
    "dependency install failed",
    error_class,
    error_code,
    metadata,
  );
}

export async function runScaffoldSkillInstall(params: {
  enabled: boolean;
  verbose?: boolean;
  targetDir: string;
}): Promise<boolean> {
  if (!params.enabled) return false;

  telemetry.capture("cli_skill_install_started", {
    ...createFunnelProps("skill_install_started"),
    skill_installed: true,
  });
  const runSkill = () =>
    params.verbose
      ? runSkillInstall(params.targetDir)
      : runSkillInstall(params.targetDir, {
          echo: false,
          stdin: "ignore",
          captureLimit: QUIET_COMMAND_CAPTURE_LIMIT,
        });
  const skillResult = await withProgress(
    "Installing OpenUI agent skill...",
    runSkill,
    params.verbose,
  );
  const skillInstalled = !skillResult.error && skillResult.status === 0;
  if (skillInstalled) {
    if (!params.verbose) {
      console.info("✓ OpenUI agent skill installed");
    }
    telemetry.capture("cli_skill_install_finished", {
      ...createFunnelProps("skill_install_finished"),
      skill_installed: true,
      duration_ms: skillResult.durationMs,
      exit_code: skillResult.status,
    });
    return true;
  }

  const properties = processErrorProperties(skillResult, "skill_install", {
    error_class: "dependency",
    error_code: "SKILL_INSTALL_FAILED",
  });
  if (properties.error_class === "user_cancelled") {
    telemetry.capture("cli_skill_install_cancelled", {
      ...createFunnelProps("skill_install_cancelled"),
      skill_installed: false,
      ...properties,
    });
    throw new CliCancelledError(
      "skill_install",
      properties.cancellation_exit_code ?? 0,
      properties,
    );
  }
  telemetry.capture("cli_skill_install_failed", {
    ...createFunnelProps("skill_install_failed"),
    skill_installed: false,
    ...properties,
  });
  console.warn(
    "\nCould not install the OpenUI agent skill automatically.\n" +
      "You can install it manually later with:\n\n" +
      "  npx skills add thesysdev/skills --skill openui\n",
  );
  return false;
}

export async function runScaffoldDevCommand(params: {
  name: string;
  targetDir: string;
  packageManager: PackageManager;
  startDev: boolean;
  noInstall?: boolean;
  missingApiKey?: { env: string; message?: string };
}): Promise<void> {
  const devCmd = params.packageManager.runCmd;

  if (params.missingApiKey) {
    telemetry.capture("cli_dev_command_skipped", {
      skip_reason: "missing_api_key",
      required_env: params.missingApiKey.env,
    });
    if (params.missingApiKey.message) console.error(params.missingApiKey.message);
    process.exitCode = 1;
    return;
  }

  if (!params.startDev) {
    telemetry.capture("cli_dev_command_skipped", {
      skip_reason: params.noInstall ? "dependencies_not_installed" : "not_immediate",
    });
    return;
  }

  telemetry.capture("cli_dev_command_started", {
    package_manager: params.packageManager.name,
  });
  const devResult = await runDevCommand(devCmd, params.targetDir);
  const stoppedNormally =
    devResult.status === 0 ||
    devResult.status === 130 ||
    devResult.status === 143 ||
    devResult.signal === "SIGINT" ||
    devResult.signal === "SIGTERM";

  if (stoppedNormally) {
    telemetry.capture("cli_dev_command_stopped", {
      package_manager: params.packageManager.name,
      duration_ms: devResult.durationMs,
      exit_code: devResult.status,
      failure_signal: devResult.signal,
    });
    return;
  }

  const exitCode = devResult.status ?? 1;
  const properties = processErrorProperties(devResult, "dev_server", {
    error_class: "process",
    error_code: "NONZERO_EXIT",
  });
  telemetry.capture("cli_dev_command_failed", {
    package_manager: params.packageManager.name,
    failure_reason: devResult.error ? "spawn_error" : "nonzero_exit",
    ...properties,
  });
  console.error(
    `\nDevelopment server exited. Retry with:\n\n> cd ${params.name}\n> ${devCmd} run dev\n`,
  );
  process.exitCode = exitCode;
}

export function formatCreateDoneMessage(o: {
  skillInstalled: boolean;
  envNote: string;
  extraNotes?: string[];
  name: string;
  devCmd: string;
  installCmd: string;
  startDev: boolean;
  dependencyInstalled: boolean;
  nextStep?: string;
}): string {
  const skillMessage = o.skillInstalled
    ? "The OpenUI agent skill was installed.\nAI coding assistants will use it to help you build with OpenUI."
    : "";
  const nextStep =
    o.nextStep ??
    (o.startDev
      ? `Starting the development server in "${o.name}"...\n\n> ${o.devCmd} run dev`
      : [
          `> cd ${o.name}`,
          ...(o.dependencyInstalled ? [] : [`> ${o.installCmd}`]),
          `> ${o.devCmd} run dev`,
        ].join("\n"));

  return `\n${[skillMessage, "Done!", o.envNote, ...(o.extraNotes ?? []), nextStep]
    .filter(Boolean)
    .join("\n\n")}\n`;
}
