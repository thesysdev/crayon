import * as fs from "node:fs";
import * as path from "node:path";

import { promptForProviderKey, resolveImmediate } from "../lib/create-helpers";
import { createFunnelProps } from "../lib/create-telemetry";
import type { CreateAppOptions, EnvResult } from "../lib/create-types";
import { resolveInstallPackageManager } from "../lib/detect-package-manager";
import { runDevCommand } from "../lib/dev-server";
import { runSkillInstall, shouldInstallSkill } from "../lib/install-skill";
import { runCommand } from "../lib/process-runner";
import type { ExampleProject } from "../lib/projects";
import { scaffoldExample, upsertEnvKey } from "../lib/scaffold-example";
import { CliCancelledError, CreateError, telemetry } from "../lib/telemetry";
import { cliErrorProperties, processErrorProperties } from "../lib/utils";

export async function runCreateExample(params: {
  options: CreateAppOptions;
  interactive: boolean;
  packageManager: ReturnType<typeof resolveInstallPackageManager>;
  t0: number;
  name: string;
  targetDir: string;
  example: ExampleProject;
}): Promise<void> {
  const { options, interactive, packageManager, t0, name, targetDir, example } = params;

  telemetry.register({ example: example.name, project_category: "example" });
  telemetry.capture("cli_example_selected", {
    ...createFunnelProps("example_selected"),
    example: example.name,
    example_source: options.example ? "flag" : interactive ? "prompt" : "default",
  });

  telemetry.capture("cli_env_resolution_started", {
    ...createFunnelProps("env_resolution_started"),
    example: example.name,
  });
  const envResult = await resolveExampleEnv(example, interactive);

  const installSkill = await shouldInstallSkill(options.skill, interactive);
  telemetry.capture("cli_skill_installed", {
    ...createFunnelProps("skill_prompt_resolved"),
    skill_installed: installSkill,
  });

  const immediateResolution = resolveImmediate(options.immediate, options.noInstall, interactive);
  const apiKeyEnv = example.envKey;
  const apiKeyAvailable =
    !apiKeyEnv || envResult.envWritten || Boolean(process.env[apiKeyEnv]?.trim());
  const devStartBlockedByMissingApiKey = immediateResolution.immediate && !apiKeyAvailable;
  telemetry.capture("cli_immediate_selected", {
    immediate: immediateResolution.immediate,
    dependency_install_requested: immediateResolution.installDependencies,
    selection_source: immediateResolution.source,
  });

  console.info(`\nScaffolding example ${example.label} into "${name}"...\n`);
  telemetry.capture("cli_scaffold_started", {
    ...createFunnelProps("scaffold_started"),
    example: example.name,
  });
  try {
    const origin = await scaffoldExample({
      example,
      targetDir,
      name,
      packageManager: packageManager.name,
    });
    if (origin === "github") {
      console.info("Checked out example from GitHub.\n");
    }
    if (packageManager.name !== "npm") {
      fs.rmSync(path.join(targetDir, "package-lock.json"), { force: true });
    }
    if (packageManager.name !== "pnpm") {
      fs.rmSync(path.join(targetDir, "pnpm-lock.yaml"), { force: true });
    }
  } catch (err) {
    const properties = cliErrorProperties(err, {
      failure_stage: "scaffold",
      error_class: "filesystem",
      error_code: "SCAFFOLD_FAILED",
    });
    telemetry.capture("cli_scaffold_failed", {
      ...createFunnelProps("scaffold_failed"),
      example: example.name,
      ...properties,
    });
    throw new CreateError(
      properties.failure_stage,
      err instanceof Error ? err.message : String(err),
      properties.error_class,
      properties.error_code,
    );
  }
  telemetry.capture("cli_scaffold_succeeded", {
    ...createFunnelProps("scaffold_succeeded"),
    example: example.name,
  });

  try {
    if (envResult.envKeyValue && example.envKey) {
      upsertEnvKey(targetDir, example.envFile, example.envKey, envResult.envKeyValue);
    }
  } catch (err) {
    const properties = cliErrorProperties(err, {
      failure_stage: "environment_write",
      error_class: "filesystem",
      error_code: "WRITE_FAILED",
    });
    throw new CreateError(
      properties.failure_stage,
      err instanceof Error ? err.message : String(err),
      properties.error_class,
      properties.error_code,
    );
  }
  telemetry.capture("cli_env_resolved", {
    ...createFunnelProps("env_written"),
    example: example.name,
    env_written: envResult.envWritten,
  });

  let skillInstalled = false;
  if (installSkill) {
    telemetry.capture("cli_skill_install_started", {
      ...createFunnelProps("skill_install_started"),
      skill_installed: installSkill,
    });
    const skillResult = await runSkillInstall(targetDir);
    skillInstalled = !skillResult.error && skillResult.status === 0;
    if (skillInstalled) {
      telemetry.capture("cli_skill_install_finished", {
        ...createFunnelProps("skill_install_finished"),
        skill_installed: true,
        duration_ms: skillResult.durationMs,
        exit_code: skillResult.status,
      });
    } else {
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
    }
  }

  const hasNpmLock = fs.existsSync(path.join(targetDir, "package-lock.json"));
  const installCmd =
    packageManager.name === "npm" && !hasNpmLock
      ? "npm install --no-audit --no-fund --progress=false"
      : packageManager.name === "pnpm"
        ? "pnpm install --no-frozen-lockfile"
        : packageManager.installCmd;
  const installArgs =
    packageManager.name === "npm" && !hasNpmLock
      ? ["install", "--no-audit", "--no-fund", "--progress=false"]
      : packageManager.name === "pnpm"
        ? ["install", "--no-frozen-lockfile"]
        : packageManager.installArgs;
  let dependencyInstalled = false;

  if (!immediateResolution.installDependencies) {
    telemetry.capture("cli_dependency_install_skipped", {
      skip_reason: "no_install_flag",
    });
    console.info(`Skipping dependency install (--no-install). Run \`${installCmd}\` later.\n`);
  } else {
    console.info(`Installing dependencies with: ${installCmd}\n`);
    telemetry.capture("cli_dependency_install_started", {
      ...createFunnelProps("dependency_install_started"),
      example: example.name,
    });
    const installResult = await runCommand(packageManager.runCmd, installArgs, targetDir);
    if (!installResult.error && installResult.status === 0) {
      dependencyInstalled = true;
      telemetry.capture("cli_dependency_install_succeeded", {
        ...createFunnelProps("dependency_install_succeeded"),
        example: example.name,
        dependency_installed: dependencyInstalled,
      });
    } else {
      const properties = processErrorProperties(installResult, "dependency_install", {
        error_class: "dependency",
        error_code: "NONZERO_EXIT",
      });
      if (properties.error_class === "user_cancelled") {
        telemetry.capture("cli_dependency_install_cancelled", {
          ...createFunnelProps("dependency_install_cancelled"),
          example: example.name,
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
        example: example.name,
        dependency_installed: dependencyInstalled,
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
  }

  const devCmd = packageManager.runCmd;
  const startDev =
    immediateResolution.immediate && dependencyInstalled && !devStartBlockedByMissingApiKey;

  telemetry.capture("cli_create_succeeded", {
    ...createFunnelProps("create_succeeded"),
    example: example.name,
    duration_ms: Date.now() - t0,
    skill_installed: skillInstalled,
    env_written: envResult.envWritten,
    dependency_installed: dependencyInstalled,
  });
  console.info(
    getStartedMessage({
      name,
      devCmd,
      exampleEnvFile: example.envFile,
      exampleEnvKey: example.envKey,
      skillInstalled,
      envWritten: envResult.envWritten,
      startDev,
      installCmd,
      dependencyInstalled,
    }),
  );

  if (devStartBlockedByMissingApiKey && apiKeyEnv) {
    telemetry.capture("cli_dev_command_skipped", {
      skip_reason: "missing_api_key",
      required_env: apiKeyEnv,
    });
    console.error(
      `\nSkipped starting the development server — ${apiKeyEnv} is missing.\n\n` +
        `Add your key to ${name}/${example.envFile}:\n\n  ${apiKeyEnv}=…\n\n` +
        `Then run:\n\n> cd ${name}\n> ${devCmd} run dev\n`,
    );
    process.exitCode = 1;
    return;
  }

  if (!startDev) {
    telemetry.capture("cli_dev_command_skipped", {
      skip_reason: options.noInstall ? "dependencies_not_installed" : "not_immediate",
    });
    return;
  }

  telemetry.capture("cli_dev_command_started", {
    package_manager: packageManager.name,
  });
  const devResult = await runDevCommand(devCmd, targetDir);
  const stoppedNormally =
    devResult.status === 0 ||
    devResult.status === 130 ||
    devResult.status === 143 ||
    devResult.signal === "SIGINT" ||
    devResult.signal === "SIGTERM";

  if (stoppedNormally) {
    telemetry.capture("cli_dev_command_stopped", {
      package_manager: packageManager.name,
      duration_ms: devResult.durationMs,
      exit_code: devResult.status,
      failure_signal: devResult.signal,
    });
  } else {
    const exitCode = devResult.status ?? 1;
    const properties = processErrorProperties(devResult, "dev_server", {
      error_class: "process",
      error_code: "NONZERO_EXIT",
    });
    telemetry.capture("cli_dev_command_failed", {
      package_manager: packageManager.name,
      failure_reason: devResult.error ? "spawn_error" : "nonzero_exit",
      ...properties,
    });
    console.error(
      `\nDevelopment server exited. Retry with:\n\n> cd ${name}\n> ${devCmd} run dev\n`,
    );
    process.exitCode = exitCode;
  }
}

async function resolveExampleEnv(
  example: ExampleProject,
  interactive: boolean,
): Promise<EnvResult & { envKeyValue?: string }> {
  if (!example.envKey) {
    return { envWritten: false };
  }

  const apiKey = interactive ? await promptForProviderKey(example.envKey) : null;
  return {
    envWritten: apiKey != null,
    envKeyValue: apiKey ?? undefined,
  };
}

function getStartedMessage(o: {
  name: string;
  devCmd: string;
  exampleEnvFile: string;
  exampleEnvKey?: string;
  skillInstalled: boolean;
  envWritten: boolean;
  startDev: boolean;
  installCmd: string;
  dependencyInstalled: boolean;
}): string {
  const skillMessage = o.skillInstalled
    ? "The OpenUI agent skill was installed.\nAI coding assistants will use it to help you build with OpenUI.\n"
    : "";

  const envKey = o.exampleEnvKey ?? "OPENAI_API_KEY";
  const envNote = o.envWritten
    ? `✅ ${o.exampleEnvFile} updated with ${envKey}.`
    : `Add ${envKey}=… to ${o.exampleEnvFile} (see the example README).`;

  const nextStep = o.startDev
    ? `Starting the development server in "${o.name}"...\n\n> ${o.devCmd} run dev`
    : [
        `> cd ${o.name}`,
        ...(o.dependencyInstalled ? [] : [`> ${o.installCmd}`]),
        `> ${o.devCmd} run dev`,
      ].join("\n");

  return `${[skillMessage.trim(), "Done!", envNote, nextStep].filter(Boolean).join("\n\n")}\n`;
}
