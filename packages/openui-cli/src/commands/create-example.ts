import * as path from "node:path";

import {
  formatCreateDoneMessage,
  runScaffoldDependencyInstall,
  runScaffoldDevCommand,
  runScaffoldSkillInstall,
} from "../lib/create-finish";
import { promptForProviderKey, resolveImmediate, withProgress } from "../lib/create-helpers";
import { createFunnelProps } from "../lib/create-telemetry";
import type { CreateAppOptions, EnvResult } from "../lib/create-types";
import { resolveInstallPackageManager } from "../lib/detect-package-manager";
import { upsertEnvVar } from "../lib/env";
import { shouldInstallSkill } from "../lib/install-skill";
import type { ExampleProject } from "../lib/projects";
import { scaffoldExample } from "../lib/scaffold-example";
import { CreateError, telemetry } from "../lib/telemetry";
import { cliErrorProperties } from "../lib/utils";

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

  console.info();
  telemetry.capture("cli_scaffold_started", {
    ...createFunnelProps("scaffold_started"),
    example: example.name,
  });
  try {
    await withProgress(
      "Scaffolding...",
      async () => {
        await scaffoldExample({
          example,
          targetDir,
          name,
          packageManager: packageManager.name,
        });
      },
      options.verbose,
    );
    if (!options.verbose) {
      console.info("✓ Scaffolded");
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
      upsertEnvVar(path.join(targetDir, example.envFile), example.envKey, envResult.envKeyValue);
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

  const { dependencyInstalled, installCmd } = await runScaffoldDependencyInstall({
    verbose: options.verbose,
    packageManager,
    targetDir,
    unlockedInstall: true,
    installDependencies: immediateResolution.installDependencies,
    telemetryProps: { example: example.name },
  });

  const skillInstalled = await runScaffoldSkillInstall({
    enabled: installSkill,
    verbose: options.verbose,
    targetDir,
  });

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
  const envKey = example.envKey ?? "OPENAI_API_KEY";
  console.info(
    formatCreateDoneMessage({
      skillInstalled,
      envNote: envResult.envWritten
        ? `✅ ${example.envFile} updated with ${envKey}.`
        : `Add ${envKey}=… to ${example.envFile} (see the example README).`,
      name,
      devCmd: packageManager.runCmd,
      installCmd,
      startDev,
      dependencyInstalled,
    }),
  );

  await runScaffoldDevCommand({
    name,
    targetDir,
    packageManager,
    startDev,
    noInstall: options.noInstall,
    missingApiKey:
      devStartBlockedByMissingApiKey && apiKeyEnv
        ? {
            env: apiKeyEnv,
            message:
              `\nSkipped starting the development server — ${apiKeyEnv} is missing.\n\n` +
              `Add your key to ${name}/${example.envFile}:\n\n  ${apiKeyEnv}=…\n\n` +
              `Then run:\n\n> cd ${name}\n> ${packageManager.runCmd} run dev\n`,
          }
        : undefined,
  });
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
