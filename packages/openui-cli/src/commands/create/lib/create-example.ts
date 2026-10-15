import * as path from "node:path";

import { resolveInstallPackageManager } from "../../../lib/detect-package-manager";
import { CliCancelledError, cliErrorProperties, CreateError } from "../../../lib/errors";
import { writeAgentsGuide } from "../../../lib/scaffold";
import { withSpinner } from "../../../lib/spinner";
import type { CreateAppOptions, EnvResult } from "./create-types";
import { resolveCloudEnv, writeEnvVar } from "./env";
import type { ExampleProject } from "./examples-catalog";
import {
  agentReadmeNote,
  cdStep,
  missingCloudKeyNote,
  readmePath,
  skillInstallHint,
} from "./messages";
import {
  exampleDevCommand,
  exampleLayout,
  isNestedExample,
  scaffoldExample,
  type ExampleLayout,
} from "./scaffold-example";
import type { CreateTelemetryClient } from "./telemetry";

export async function runCreateExample(params: {
  options: CreateAppOptions;
  interactive: boolean;
  agent?: string;
  packageManager: ReturnType<typeof resolveInstallPackageManager>;
  t0: number;
  name: string;
  /** What to `cd` into: the project folder, or `.` when created in place. */
  dir: string;
  targetDir: string;
  example: ExampleProject;
  tel: CreateTelemetryClient;
  verbose: boolean;
}): Promise<void> {
  const {
    options,
    interactive,
    agent,
    packageManager,
    t0,
    name,
    dir,
    targetDir,
    example,
    tel,
    verbose,
  } = params;

  tel.registerContext({ example: example.name, project_category: "example" });
  tel.trackExampleSelected({
    example: example.name,
    example_source: options.example ? "flag" : interactive ? "prompt" : "default",
  });

  tel.trackEnvResolutionStarted({ example: example.name });
  const envResult = await resolveExampleEnv(example, name, options, interactive, agent, tel);

  tel.trackImmediateSelected({
    immediate: false,
    dependency_install_requested: false,
    selection_source: "no_install",
  });

  console.info();
  tel.trackScaffoldStarted({ example: example.name });
  let layout: ExampleLayout | undefined;
  try {
    const onRetry = tel.reportNetworkRetry("source_checkout");
    const runScaffold = async () => {
      const scaffolded = await scaffoldExample({
        example,
        targetDir,
        name,
        packageManager: packageManager.name,
        onRetry,
      });
      if (!options.noSkill) await writeAgentsGuide(targetDir, { onRetry });
      return scaffolded;
    };
    layout = verbose ? await runScaffold() : await withSpinner("Scaffolding...", runScaffold);
    if (!verbose) {
      console.info("✓ Scaffolded");
    }
  } catch (err) {
    const properties = cliErrorProperties(err, {
      failure_stage: "scaffold",
      error_class: "filesystem",
      error_code: "SCAFFOLD_FAILED",
    });
    tel.trackScaffoldFailed({
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
  tel.trackScaffoldSucceeded({ example: example.name });

  try {
    if (envResult.envKeyValue && example.env.key) {
      writeEnvVar(path.join(targetDir, example.env.file), example.env.key, envResult.envKeyValue);
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
  tel.trackEnvResolved({
    example: example.name,
    env_written: envResult.envWritten,
    auth_method: envResult.authMethod,
    auth_succeeded: envResult.authSucceeded,
  });

  layout ??= exampleLayout(targetDir);
  const installCmd = packageManager.installCmd;
  tel.trackDependencyInstallSkipped({
    skip_reason: "example_scaffold_only",
  });
  tel.trackDevCommandSkipped({
    skip_reason: "not_immediate",
  });

  tel.trackCreateSucceeded({
    example: example.name,
    duration_ms: Date.now() - t0,
    env_written: envResult.envWritten,
    auth_method: envResult.authMethod,
    auth_succeeded: envResult.authSucceeded,
    dependency_installed: false,
  });
  const agentReadme = agent ? readmePath(targetDir) : undefined;
  const envNote = exampleEnvNote(example.env, envResult.envWritten, dir, packageManager.dlxCmd);
  const nextStep = isNestedExample(layout)
    ? nestedExampleNextSteps({
        name: dir,
        targetDir,
        layout,
        runCmd: packageManager.runCmd,
        installCmd,
      })
    : [...cdStep(dir), `> ${installCmd}`, `> ${packageManager.runCmd} run dev`].join("\n");

  console.info(
    `\n${[
      "Done!",
      envNote,
      nextStep,
      options.noSkill ? skillInstallHint() : "",
      agentReadme ? agentReadmeNote(agentReadme) : "",
    ]
      .filter(Boolean)
      .join("\n\n")}\n`,
  );
}

async function resolveExampleEnv(
  example: ExampleProject,
  name: string,
  options: CreateAppOptions,
  interactive: boolean,
  agent: string | undefined,
  tel: CreateTelemetryClient,
): Promise<EnvResult & { envKeyValue?: string }> {
  if (!example.env.key) {
    return { envWritten: false };
  }

  if (example.env.key === "THESYS_API_KEY") {
    const result = await resolveCloudEnv(
      name,
      { ...options, envFile: example.env.file },
      interactive,
      agent,
      tel,
    );
    return { ...result, envKeyValue: result.envVars?.[example.env.key] || undefined };
  }

  const apiKey = interactive ? await promptForProviderKey(example.env.key) : null;
  return {
    envWritten: apiKey != null,
    envKeyValue: apiKey ?? undefined,
  };
}

async function promptForProviderKey(envKey: string): Promise<string | null> {
  try {
    const { input } = await import("@inquirer/prompts");
    const apiKey = (
      await input({
        message: `Enter your ${envKey} (leave blank to skip):`,
      })
    ).trim();
    return apiKey || null;
  } catch (error) {
    const { ExitPromptError } = await import("@inquirer/core");
    if (error instanceof ExitPromptError) {
      throw new CliCancelledError("environment_resolution");
    }
    throw error;
  }
}

function exampleEnvNote(
  env: ExampleProject["env"],
  envWritten: boolean,
  name: string,
  dlxCmd: string,
): string {
  if (!env.key) return `Add your API keys to ${env.file} (see the example README).`;
  if (envWritten) return `✅ ${env.file} updated with ${env.key}.`;
  if (env.key === "THESYS_API_KEY") return missingCloudKeyNote(name, dlxCmd, env.file);
  return `Add ${env.key}=… to ${env.file} (see the example README).`;
}

function posixJoin(...parts: string[]): string {
  return parts.filter((part) => part && part !== ".").join("/");
}

function nestedExampleNextSteps(params: {
  name: string;
  targetDir: string;
  layout: ExampleLayout;
  runCmd: string;
  installCmd: string;
}): string {
  const blocks: string[] = [];
  for (const relative of params.layout.jsPackages) {
    const pkgDir = relative === "." ? params.targetDir : path.join(params.targetDir, relative);
    blocks.push(
      [
        `> cd ${posixJoin(params.name, relative)}`,
        `> ${params.installCmd}`,
        `> ${exampleDevCommand(pkgDir, params.runCmd)}`,
      ].join("\n"),
    );
  }
  for (const relative of params.layout.pythonPackages) {
    blocks.push(
      [`> cd ${posixJoin(params.name, relative)}`, `> uv run uvicorn app.main:app --reload`].join(
        "\n",
      ),
    );
  }
  return blocks.join("\n\n");
}
