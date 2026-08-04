import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import {
  classifyCloudAuthFailure,
  resolveCloudApiKey,
  THESYS_KEYS_URL,
  type CloudAuthMethod,
} from "../auth/mint";
import {
  aiSetupFromTemplate,
  captureCreateStageSkipped,
  createFunnelProps,
  instrumentCreateStage,
  type CreateStageTerminalStatus,
} from "../lib/create-telemetry";
import type { CreateAppOptions, EnvResult, TemplateName } from "../lib/create-types";
import {
  resolveInstallPackageManager,
  type PackageManagerName,
} from "../lib/detect-package-manager";
import {
  classifyProcessFailure,
  classifyUnknownFailure,
  getProcessCancellationExitCode,
  withFailureFallback,
} from "../lib/error-telemetry";
import { runSkillInstall, shouldInstallSkill } from "../lib/install-skill";
import { runCommand, type CommandResult } from "../lib/process-runner";
import { resolveArgs } from "../lib/resolve-args";
import { CliCancelledError, CreateError, telemetry } from "../lib/telemetry";
import { normalizeAuth, normalizeTemplate } from "../lib/utils";

const errorMessage = (error: unknown) => (error instanceof Error ? error.message : String(error));
const commandStageStatus = (result: CommandResult): CreateStageTerminalStatus =>
  result.succeeded ? "succeeded" : getProcessCancellationExitCode(result) ? "cancelled" : "failed";
const commandStageProperties = (result: CommandResult): Record<string, unknown> =>
  result.succeeded ? {} : classifyProcessFailure(result);

function shouldCopyTemplatePath(templateDir: string, src: string): boolean {
  const rel = path.relative(templateDir, src);
  if (!rel) return true;
  const top = rel.split(path.sep)[0] ?? "";
  // never copy install/build artifacts that may sit in a template dir
  return !["node_modules", ".next", ".turbo", "dist"].includes(top);
}

function restoreDotfiles(projectDir: string) {
  // Templates ship `gitignore` un-dotted: npm silently strips `.gitignore`
  // files (at any depth) from published packages, so a dotted copy never
  // reaches the scaffold — and freshly created apps would commit `.env`.
  // Restore the real name here instead.
  const plain = path.join(projectDir, "gitignore");
  if (fs.existsSync(plain)) {
    fs.renameSync(plain, path.join(projectDir, ".gitignore"));
  }
}

function buildAppId(name: string): string {
  // Stable per-scaffold identity (see writeEnv). Slugified because the name is
  // free-form and APP_ID lands in .env and ?app_id= query params; the random
  // suffix keeps two same-named apps in one org from colliding.
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return `${slug}-${Math.random().toString(36).slice(2, 8)}`;
}

function rewritePackageJson(projectDir: string, name: string, packageManager: PackageManagerName) {
  // package.json: set the project name and de-vendor monorepo-local deps
  // (workspace:* / file: / catalog:) to the published "latest". link: deps are
  // rewritten to an absolute file: path so locally-linked packages (e.g.
  // @openuidev/thesys) keep resolving against the developer's checkout under any
  // package manager — npm rejects link:, and ~ isn't expanded. Temporary, until
  // these packages are published.
  const pkgPath = path.join(projectDir, "package.json");
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8")) as {
    name: string;
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    pnpm?: unknown;
  };
  pkg.name = name;
  if (packageManager !== "pnpm") delete pkg.pnpm;
  for (const section of ["dependencies", "devDependencies"] as const) {
    const deps = pkg[section];
    if (!deps) continue;
    for (const key of Object.keys(deps)) {
      const v = deps[key];
      if (!v) continue;
      if (v.startsWith("link:")) {
        const target = v.slice("link:".length);
        const abs = target.startsWith("~")
          ? path.join(os.homedir(), target.slice(1))
          : path.resolve(target);
        deps[key] = `file:${abs}`;
        continue;
      }
      // workspace:/file:/catalog: are monorepo-only protocols npm/yarn/bun
      // can't resolve standalone — pin them to the published "latest".
      if (/^(workspace:|file:|catalog:)/.test(v)) deps[key] = "latest";
    }
  }
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");

  // Keep the copied npm lockfile's root package metadata aligned so npm ci can
  // consume the template without having to rewrite or re-resolve it.
  const lockPath = path.join(projectDir, "package-lock.json");
  if (fs.existsSync(lockPath)) {
    const lock = JSON.parse(fs.readFileSync(lockPath, "utf8")) as {
      name?: string;
      packages?: Record<
        string,
        {
          name?: string;
          dependencies?: Record<string, string>;
          devDependencies?: Record<string, string>;
        }
      >;
    };
    lock.name = name;
    const lockRoot = lock.packages?.[""];
    if (lockRoot) {
      lockRoot.name = name;
      lockRoot.dependencies = pkg.dependencies;
      lockRoot.devDependencies = pkg.devDependencies;
    }
    fs.writeFileSync(lockPath, JSON.stringify(lock, null, 2) + "\n");
  }
}

export async function runCreateApp(options: CreateAppOptions): Promise<void> {
  const interactive = !options.noInteractive;
  const t0 = Date.now();
  telemetry.register({ interactive });
  telemetry.capture("cli_create_started", {
    ...createFunnelProps("create_started"),
    interactive,
    has_name_arg: Boolean(options.name),
    has_template_arg: Boolean(options.template),
    has_api_key_arg: Boolean(options.apiKey),
    has_auth_arg: Boolean(options.auth),
    no_install: Boolean(options.noInstall),
    immediate_arg: options.immediate,
  });

  const args = await instrumentCreateStage(
    "args_resolution",
    async () => {
      const template = normalizeTemplate(options.template);
      const auth = normalizeAuth(options.auth);
      const resolved = await resolveArgs(
        {
          name: options.name
            ? { value: options.name }
            : {
                prompt: { type: "input", message: "Project name?", default: "openui-agent" },
                required: true,
              },
          template: template
            ? { value: template }
            : {
                prompt: {
                  type: "select",
                  message: "Choose your agent backend",
                  choices: [
                    {
                      value: "openui-cloud",
                      name: "OpenUI Cloud — free hosted models, managed history, tools & artifacts; fastest setup (recommended)",
                    },
                    {
                      value: "openui-self-hosted",
                      name: "Self-hosted — bring your own provider and self-manage the entire backend",
                    },
                  ],
                },
                required: true,
              },
        },
        interactive,
      );
      return { ...resolved, auth };
    },
    { properties: { interactive } },
  );

  const { name, template, auth } = args as {
    name: string;
    template: TemplateName;
    auth?: CloudAuthMethod;
  };
  const aiSetup = aiSetupFromTemplate(template);
  const stageContext = { template, ai_setup: aiSetup };
  telemetry.register({ template, ai_setup: aiSetup });
  telemetry.capture("cli_ai_setup_selected", {
    ...createFunnelProps("ai_setup_selected"),
    template,
    ai_setup: aiSetup,
  });

  const { targetDir, packageManager, templateDir } = await instrumentCreateStage(
    "preflight",
    () => {
      const resolvedTargetDir = path.resolve(process.cwd(), name);
      if (fs.existsSync(resolvedTargetDir)) {
        throw new CreateError("preflight", `Directory "${name}" already exists.`, {
          telemetryProperties: {
            failure_category: "filesystem",
            failure_code: "TARGET_EXISTS",
          },
        });
      }

      const resolvedTemplateDir = path.join(__dirname, "..", "templates", template);
      if (!fs.existsSync(resolvedTemplateDir)) {
        throw new CreateError(
          "preflight",
          `Template "${template}" not found. Rebuild the CLI with \`pnpm build\`.`,
          {
            telemetryProperties: {
              failure_category: "filesystem",
              failure_code: "TEMPLATE_MISSING",
            },
          },
        );
      }
      return {
        targetDir: resolvedTargetDir,
        packageManager: resolveInstallPackageManager(),
        templateDir: resolvedTemplateDir,
      };
    },
    {
      properties: stageContext,
      resultProperties: (result) => ({ package_manager: result.packageManager.name }),
    },
  );
  telemetry.register({ package_manager: packageManager.name });

  const captureScaffoldFailed = (error: unknown) => {
    telemetry.capture("cli_scaffold_failed", {
      ...createFunnelProps("scaffold_failed"),
      ...stageContext,
      ...withFailureFallback(classifyUnknownFailure(error), {
        failure_category: "filesystem",
        failure_code: "SCAFFOLD_FAILED",
      }),
    });
  };

  telemetry.capture("cli_env_resolution_started", {
    ...createFunnelProps("env_resolution_started"),
    template,
    ai_setup: aiSetup,
  });
  const envResult = await instrumentCreateStage(
    "environment_resolution",
    () => {
      if (template === "openui-self-hosted") {
        captureCreateStageSkipped("cloud_auth", "not_cloud_template", stageContext);
        return resolveChatEnv(interactive);
      }
      return resolveCloudEnv(name, options.apiKey, auth, interactive, stageContext);
    },
    {
      properties: stageContext,
      resultProperties: (result) => ({
        env_written: result.envWritten,
        auth_method: result.authMethod,
        auth_succeeded: result.authSucceeded,
      }),
    },
  );

  const installSkill = await instrumentCreateStage(
    "skill_prompt",
    () => shouldInstallSkill(options.skill, interactive),
    {
      properties: stageContext,
      resultProperties: (requested) => ({ skill_install_requested: requested }),
    },
  );
  telemetry.capture("cli_skill_installed", {
    ...createFunnelProps("skill_prompt_resolved"),
    skill_installed: installSkill,
    skill_install_requested: installSkill,
    event_semantics: "legacy_install_decision",
  });

  const immediateResolution = await instrumentCreateStage(
    "immediate_prompt",
    () => resolveImmediate(options.immediate, options.noInstall, interactive),
    {
      properties: stageContext,
      resultProperties: (result) => ({
        immediate: result.immediate,
        dependency_install_requested: result.installDependencies,
        selection_source: result.source,
      }),
    },
  );
  telemetry.capture("cli_immediate_selected", {
    immediate: immediateResolution.immediate,
    dependency_install_requested: immediateResolution.installDependencies,
    selection_source: immediateResolution.source,
  });

  console.info(`\nScaffolding ${template} into "${name}"...\n`);
  await instrumentCreateStage(
    "scaffold",
    () => {
      telemetry.capture("cli_scaffold_started", {
        ...createFunnelProps("scaffold_started"),
        ...stageContext,
      });
      try {
        fs.cpSync(templateDir, targetDir, {
          recursive: true,
          filter: (src) => shouldCopyTemplatePath(templateDir, src),
        });
        restoreDotfiles(targetDir);
        rewritePackageJson(targetDir, name, packageManager.name);
        // npm ci requires the copied package-lock; other managers resolve from package.json.
        if (packageManager.name !== "npm") {
          fs.rmSync(path.join(targetDir, "package-lock.json"), { force: true });
        }
        // Keep pnpm-only install metadata out of npm/yarn/bun scaffolds.
        if (packageManager.name !== "pnpm") {
          fs.rmSync(path.join(targetDir, "pnpm-lock.yaml"), { force: true });
          fs.rmSync(path.join(targetDir, "pnpm-workspace.yaml"), { force: true });
        }
      } catch (error) {
        captureScaffoldFailed(error);
        throw error;
      }
      telemetry.capture("cli_scaffold_succeeded", {
        ...createFunnelProps("scaffold_succeeded"),
        ...stageContext,
      });
    },
    {
      properties: stageContext,
      errorProperties: (error) =>
        withFailureFallback(classifyUnknownFailure(error), {
          failure_category: "filesystem",
          failure_code: "SCAFFOLD_FAILED",
        }),
    },
  );

  await instrumentCreateStage(
    "environment_write",
    () =>
      writeEnv(targetDir, envResult, template === "openui-cloud" ? buildAppId(name) : undefined),
    {
      properties: stageContext,
      resultProperties: () => ({
        env_written: envResult.envWritten,
        auth_method: envResult.authMethod,
        auth_succeeded: envResult.authSucceeded,
      }),
      errorProperties: (error) =>
        withFailureFallback(classifyUnknownFailure(error), {
          failure_category: "filesystem",
          failure_code: "WRITE_FAILED",
        }),
    },
  );
  telemetry.capture("cli_env_resolved", {
    ...createFunnelProps("env_written"),
    template,
    ai_setup: aiSetup,
    env_written: envResult.envWritten,
    auth_method: envResult.authMethod,
    auth_succeeded: envResult.authSucceeded,
  });

  let skillInstalled = false;
  if (installSkill) {
    telemetry.capture("cli_skill_install_started", {
      ...createFunnelProps("skill_install_started"),
      skill_install_requested: true,
      installer: "npx",
    });
    const result = await instrumentCreateStage("skill_install", () => runSkillInstall(targetDir), {
      properties: { ...stageContext, installer: "npx" },
      resultStatus: commandStageStatus,
      resultProperties: commandStageProperties,
    });
    if (result.succeeded) {
      skillInstalled = true;
      const successProps = {
        skill_installed: true,
        installer: "npx",
        duration_ms: result.durationMs,
      };
      telemetry.capture("cli_skill_install_succeeded", {
        ...createFunnelProps("skill_install_succeeded"),
        ...successProps,
      });
      telemetry.capture("cli_skill_install_finished", {
        ...createFunnelProps("skill_install_finished"),
        ...successProps,
      });
    } else {
      const failure = classifyProcessFailure(result);
      const cancellationExitCode = getProcessCancellationExitCode(result);
      if (cancellationExitCode) {
        telemetry.capture("cli_skill_install_cancelled", {
          ...createFunnelProps("skill_install_cancelled"),
          ...failure,
          skill_installed: false,
          installer: "npx",
          duration_ms: result.durationMs,
        });
        throw new CliCancelledError("skill_install", cancellationExitCode);
      }
      telemetry.capture("cli_skill_install_failed", {
        ...createFunnelProps("skill_install_failed"),
        ...failure,
        skill_installed: false,
        installer: "npx",
        duration_ms: result.durationMs,
      });
      telemetry.capture("cli_skill_install_finished", {
        ...createFunnelProps("skill_install_finished"),
        ...failure,
        skill_installed: false,
        installer: "npx",
        duration_ms: result.durationMs,
      });
      console.warn(
        "\nCould not install the OpenUI agent skill automatically.\n" +
          "You can install it manually later with:\n\n" +
          "  npx skills add thesysdev/skills --skill openui\n",
      );
    }
  } else {
    captureCreateStageSkipped("skill_install", "not_requested", stageContext);
  }

  const installCmd = packageManager.installCmd;
  let dependencyInstalled = false;

  if (!immediateResolution.installDependencies) {
    captureCreateStageSkipped("dependency_install", "no_install_flag", {
      ...stageContext,
      package_manager: packageManager.name,
    });
    telemetry.capture("cli_dependency_install_skipped", {
      skip_reason: "no_install_flag",
    });
    console.info(`Skipping dependency install (--no-install). Run \`${installCmd}\` later.\n`);
  } else {
    console.info(`Installing dependencies with: ${installCmd}\n`);
    telemetry.capture("cli_dependency_install_started", {
      ...createFunnelProps("dependency_install_started"),
      template,
      ai_setup: aiSetup,
    });
    const installResult = await instrumentCreateStage(
      "dependency_install",
      () => runCommand(packageManager.runCmd, packageManager.installArgs, targetDir),
      {
        properties: { ...stageContext, package_manager: packageManager.name },
        resultStatus: commandStageStatus,
        resultProperties: commandStageProperties,
      },
    );
    if (installResult.succeeded) {
      dependencyInstalled = true;
      telemetry.capture("cli_dependency_install_succeeded", {
        ...createFunnelProps("dependency_install_succeeded"),
        template,
        ai_setup: aiSetup,
        dependency_installed: dependencyInstalled,
        duration_ms: installResult.durationMs,
      });
    } else {
      const failure = classifyProcessFailure(installResult);
      const cancellationExitCode = getProcessCancellationExitCode(installResult);
      if (cancellationExitCode) {
        telemetry.capture("cli_dependency_install_cancelled", {
          ...createFunnelProps("dependency_install_cancelled"),
          ...stageContext,
          ...failure,
          dependency_installed: false,
          duration_ms: installResult.durationMs,
        });
        throw new CliCancelledError("dependency_install", cancellationExitCode);
      }
      telemetry.capture("cli_dependency_install_failed", {
        ...createFunnelProps("dependency_install_failed"),
        ...stageContext,
        ...failure,
        dependency_installed: dependencyInstalled,
        duration_ms: installResult.durationMs,
      });
      throw new CreateError("dependency_install", "dependency install failed", {
        telemetryProperties: failure,
      });
    }
  }

  const devCmd = packageManager.runCmd;
  const startDev = immediateResolution.immediate && dependencyInstalled;

  telemetry.capture("cli_create_succeeded", {
    ...createFunnelProps("create_succeeded"),
    template,
    ai_setup: aiSetup,
    duration_ms: Date.now() - t0,
    skill_installed: skillInstalled,
    env_written: envResult.envWritten,
    dependency_installed: dependencyInstalled,
  });
  console.info(
    getStartedMessage({
      name,
      devCmd,
      template,
      skillInstalled,
      envWritten: envResult.envWritten,
      startDev,
      installCmd,
      dependencyInstalled,
    }),
  );

  if (!startDev) {
    telemetry.capture("cli_dev_command_skipped", {
      skip_reason: options.noInstall ? "dependencies_not_installed" : "not_immediate",
    });
    return;
  }

  const devStartedAt = Date.now();
  telemetry.capture("cli_dev_command_started", {
    package_manager: packageManager.name,
  });
  const devResult = await runCommand(devCmd, ["run", "dev"], targetDir);
  const durationMs = Math.max(devResult.durationMs, Date.now() - devStartedAt);
  const stoppedNormally =
    devResult.exitCode === 0 ||
    devResult.exitCode === 130 ||
    devResult.exitCode === 143 ||
    devResult.signal === "SIGINT" ||
    devResult.signal === "SIGTERM";

  if (stoppedNormally) {
    telemetry.capture("cli_dev_command_stopped", {
      package_manager: packageManager.name,
      duration_ms: durationMs,
      exit_code: devResult.exitCode,
      failure_signal: devResult.signal,
    });
  } else {
    const exitCode = devResult.exitCode ?? 1;
    const failure = classifyProcessFailure(devResult);
    telemetry.capture("cli_dev_command_failed", {
      package_manager: packageManager.name,
      stage: "dev_server",
      failure_stage: "dev_server",
      duration_ms: durationMs,
      failure_reason: devResult.spawnErrorCode ? "spawn_error" : "nonzero_exit",
      ...failure,
    });
    console.error(
      `\nDevelopment server exited. Retry with:\n\n> cd ${name}\n> ${devCmd} run dev\n`,
    );
    process.exitCode = exitCode;
  }
}

const isInteractiveTerminal = () => Boolean(process.stdin.isTTY && process.stdout.isTTY);

async function resolveImmediate(
  immediate: boolean | undefined,
  noInstall: boolean | undefined,
  interactive: boolean,
): Promise<{
  immediate: boolean;
  installDependencies: boolean;
  source: "flag" | "interactive_prompt" | "no_install" | "noninteractive_default";
}> {
  if (noInstall) {
    return { immediate: false, installDependencies: false, source: "no_install" };
  }
  if (immediate !== undefined) {
    return {
      immediate,
      installDependencies: true,
      source: "flag",
    };
  }
  if (!interactive || !isInteractiveTerminal()) {
    return {
      immediate: false,
      installDependencies: true,
      source: "noninteractive_default",
    };
  }

  try {
    const { confirm } = await import("@inquirer/prompts");
    const selected = await confirm({
      message: "Start dev server after install?",
      default: true,
    });
    return {
      immediate: selected,
      installDependencies: true,
      source: "interactive_prompt",
    };
  } catch (error) {
    const { ExitPromptError } = await import("@inquirer/core");
    if (error instanceof ExitPromptError) throw new CliCancelledError("immediate_prompt");
    throw error;
  }
}

async function writeEnv(targetDir: string, result: EnvResult, appId?: string): Promise<void> {
  // APP_ID is the scaffold's stable identity: the frontend-token route sends
  // it as `app_id`, so every conversation this app creates is bound to it and
  // apps sharing one org API key stay isolated from each other. It must stay
  // stable for the app's lifetime — regenerating it orphans existing threads.
  const content = `${result.envContent ?? ""}${appId ? `APP_ID=${appId}\n` : ""}`;
  if (!content) return;
  await fs.promises.writeFile(path.join(targetDir, ".env"), content);
}

async function resolveChatEnv(interactive: boolean): Promise<EnvResult> {
  if (!interactive) return { envWritten: false };
  try {
    const { input } = await import("@inquirer/prompts");
    const apiKey = (
      await input({
        message: "Enter your OpenAI-compatible provider API key (leave blank to skip):",
      })
    ).trim();
    if (!apiKey) return { envWritten: false };
    return { envWritten: true, envContent: `OPENAI_API_KEY=${apiKey}\n` };
  } catch (error) {
    const { ExitPromptError } = await import("@inquirer/core");
    if (error instanceof ExitPromptError) {
      throw new CliCancelledError("environment_resolution");
    }
    throw error;
  }
}

async function resolveCloudEnv(
  name: string,
  apiKeyOption: string | undefined,
  auth: CloudAuthMethod | undefined,
  interactive: boolean,
  stageContext: Record<string, unknown>,
): Promise<EnvResult> {
  let apiKey: string | null = null;
  let authMethod: EnvResult["authMethod"];
  const requestedAuthMethod = auth ?? (apiKeyOption ? "apikey-flag" : undefined);
  try {
    telemetry.capture("cli_cloud_auth_started", {
      ...createFunnelProps("cloud_auth_started"),
      auth_method: requestedAuthMethod,
    });
    const resolved = await instrumentCreateStage(
      "cloud_auth",
      () =>
        resolveCloudApiKey({
          apiKey: apiKeyOption,
          auth,
          projectName: name,
          interactive,
        }),
      {
        properties: {
          ...stageContext,
          ...(requestedAuthMethod ? { auth_method_requested: requestedAuthMethod } : {}),
        },
        resultStatus: (result) => (result.key == null ? "skipped" : "succeeded"),
        resultProperties: (result) => ({
          auth_method: result.method,
          auth_succeeded: result.key != null,
          ...(result.key == null ? { skip_reason: `${result.method}_without_key` } : {}),
        }),
        errorProperties: classifyCloudAuthFailure,
      },
    );
    apiKey = resolved.key;
    authMethod = resolved.method;
    telemetry.capture("cli_cloud_auth_method", {
      ...createFunnelProps("cloud_auth_resolved"),
      auth_method: resolved.method,
      auth_succeeded: apiKey != null,
    });
  } catch (err) {
    if (err instanceof CliCancelledError) throw err;
    const failure = classifyCloudAuthFailure(err);
    telemetry.capture("cli_cloud_auth_failed", {
      ...createFunnelProps("cloud_auth_failed"),
      ...failure,
      auth_method: failure["auth_method"] ?? requestedAuthMethod,
      auth_succeeded: false,
    });
    console.error(`\n⚠ Could not obtain an API key: ${errorMessage(err)}`);
    console.error(`  Add THESYS_API_KEY to .env later (keys: ${THESYS_KEYS_URL}).\n`);
  }
  const lines = [`THESYS_API_KEY=${apiKey ?? ""}`, `DEMO_USER_ID=demo-user`];
  return {
    envWritten: apiKey != null,
    envContent: lines.join("\n") + "\n",
    authMethod,
    authSucceeded: apiKey != null,
  };
}

function getStartedMessage(o: {
  name: string;
  devCmd: string;
  template: TemplateName;
  skillInstalled: boolean;
  envWritten: boolean;
  startDev: boolean;
  installCmd: string;
  dependencyInstalled: boolean;
}): string {
  const skillMessage = o.skillInstalled
    ? "The OpenUI agent skill was installed.\nAI coding assistants will use it to help you build with OpenUI.\n"
    : "";

  const envNote =
    o.template === "openui-cloud"
      ? o.envWritten
        ? "✅ .env created with your OpenUI Cloud API key + base URL."
        : `⚠ .env created without a key. Add THESYS_API_KEY=… (get one at ${THESYS_KEYS_URL}).`
      : o.envWritten
        ? "✅ .env created with your API key."
        : "Add your API key to .env:\nOPENAI_API_KEY=sk-your-key-here";

  const nextStep = o.startDev
    ? `Starting the development server in "${o.name}"...\n\n> ${o.devCmd} run dev`
    : [
        `> cd ${o.name}`,
        ...(o.dependencyInstalled ? [] : [`> ${o.installCmd}`]),
        `> ${o.devCmd} run dev`,
      ].join("\n");

  return `${skillMessage}
Done!

${envNote}

${nextStep}
`;
}
