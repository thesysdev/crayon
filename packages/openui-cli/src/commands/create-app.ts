import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import { resolveCloudApiKey, THESYS_KEYS_URL } from "../auth/mint";
import { aiSetupFromTemplate, createFunnelProps } from "../lib/create-telemetry";
import type {
  BackendFramework,
  CreateAppOptions,
  EnvResult,
  TemplateName,
} from "../lib/create-types";
import {
  resolveInstallPackageManager,
  type PackageManagerName,
} from "../lib/detect-package-manager";
import { runSkillInstall, shouldInstallSkill } from "../lib/install-skill";
import { runCommand } from "../lib/process-runner";
import { resolveArgs } from "../lib/resolve-args";
import { CliCancelledError, CreateError, telemetry } from "../lib/telemetry";
import { cliErrorProperties, processErrorProperties } from "../lib/utils";

const backendDependencies: Record<
  TemplateName,
  Record<Exclude<BackendFramework, "none">, Record<string, string>>
> = {
  "openui-cloud": {
    langgraph: {
      "@langchain/core": "^1.2.5",
      "@langchain/langgraph": "^1.4.9",
      "@langchain/openai": "^1.5.6",
      "@openuidev/langchain": "^0.0.2",
      langchain: "^1.5.5",
    },
    "vercel-ai-sdk": {
      "@ai-sdk/openai": "^3.0.91",
      ai: "^6.0.246",
      zod: "^4.4.3",
    },
  },
  "openui-self-hosted": {
    langgraph: {
      "@langchain/core": "^1.2.5",
      "@langchain/langgraph": "^1.4.9",
      "@langchain/openai": "^1.5.6",
      "@openuidev/react-headless": "^0.9.7",
      zod: "^4.4.3",
    },
    "vercel-ai-sdk": {
      "@ai-sdk/openai": "3.0.90",
      "@openuidev/react-headless": "^0.9.6",
      ai: "6.0.244",
      zod: "^4.4.3",
    },
  },
};

const backendDevDependencies: Partial<
  Record<TemplateName, Partial<Record<Exclude<BackendFramework, "none">, Record<string, string>>>>
> = {
  "openui-cloud": {
    langgraph: {
      "@langchain/langgraph-cli": "^1.4.4",
      "npm-run-all2": "^9.0.2",
    },
  },
};

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

function requiredApiKeyEnv(template: TemplateName): "THESYS_API_KEY" | "OPENAI_API_KEY" {
  return template === "openui-cloud" ? "THESYS_API_KEY" : "OPENAI_API_KEY";
}

function rewritePackageJson(
  projectDir: string,
  name: string,
  packageManager: PackageManagerName,
  template: TemplateName,
  backendFramework: BackendFramework,
) {
  // package.json: set the project name and de-vendor monorepo-local deps
  // (workspace:* / file: / catalog:) to the published "latest". link: deps are
  // rewritten to an absolute file: path so locally-linked packages (e.g.
  // @openuidev/thesys) keep resolving against the developer's checkout under any
  // package manager — npm rejects link:, and ~ isn't expanded. Temporary, until
  // these packages are published.
  const pkgPath = path.join(projectDir, "package.json");
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8")) as {
    name: string;
    scripts?: Record<string, string>;
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    pnpm?: unknown;
  };
  pkg.name = name;
  if (packageManager !== "pnpm") delete pkg.pnpm;
  if (backendFramework !== "none") {
    pkg.dependencies ??= {};
    if (template === "openui-self-hosted") delete pkg.dependencies["openai"];
    Object.assign(pkg.dependencies, backendDependencies[template][backendFramework]);
    Object.assign(
      (pkg.devDependencies ??= {}),
      backendDevDependencies[template]?.[backendFramework] ?? {},
    );
  }
  if (template === "openui-cloud" && backendFramework === "langgraph") {
    pkg.scripts = {
      ...(pkg.scripts ?? {}),
      dev: "run-p dev:langgraph dev:next",
      "dev:langgraph": "langgraphjs dev",
      "dev:next": "next dev",
    };
  }
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

function applyBackendFiles(projectDir: string, backendFramework: BackendFramework) {
  const routeOptionsDir = path.join(projectDir, "_backend-routes");
  const pageOptionsDir = path.join(projectDir, "_backend-pages");
  const extrasOptionsDir = path.join(projectDir, "_backend-extras");
  if (backendFramework !== "none") {
    const routeSource = path.join(routeOptionsDir, `${backendFramework}.ts`);
    const routeDestination = path.join(projectDir, "src", "app", "api", "chat", "route.ts");
    if (!fs.existsSync(routeSource)) {
      throw new CreateError(
        "template_missing",
        `Backend route "${backendFramework}" not found. Rebuild the CLI with \`pnpm build\`.`,
      );
    }
    fs.copyFileSync(routeSource, routeDestination);

    // Framework routes speak their native wire protocols, so select the
    // matching frontend stream adapter and message format too.
    if (fs.existsSync(pageOptionsDir)) {
      const pageSource = path.join(pageOptionsDir, `${backendFramework}.tsx`);
      if (!fs.existsSync(pageSource)) {
        throw new CreateError(
          "template_missing",
          `Backend page "${backendFramework}" not found. Rebuild the CLI with \`pnpm build\`.`,
        );
      }
      fs.copyFileSync(pageSource, path.join(projectDir, "src", "app", "page.tsx"));
    }

    const extrasSource = path.join(extrasOptionsDir, backendFramework);
    if (fs.existsSync(extrasSource)) {
      for (const entry of fs.readdirSync(extrasSource)) {
        fs.cpSync(path.join(extrasSource, entry), path.join(projectDir, entry), {
          recursive: true,
        });
      }
    }

    // The selected framework backend owns its tool loop and stream encoding.
    fs.rmSync(path.join(projectDir, "src", "lib", "tool-loop.ts"), { force: true });
  }
  fs.rmSync(routeOptionsDir, { recursive: true, force: true });
  fs.rmSync(pageOptionsDir, { recursive: true, force: true });
  fs.rmSync(extrasOptionsDir, { recursive: true, force: true });
}

export async function runCreateApp(options: CreateAppOptions): Promise<void> {
  const interactive = !options.noInteractive;
  const packageManager = resolveInstallPackageManager();
  const t0 = Date.now();
  telemetry.register({ interactive, package_manager: packageManager.name });
  telemetry.capture("cli_create_started", {
    ...createFunnelProps("create_started"),
    interactive,
    has_name_arg: Boolean(options.name),
    has_template_arg: Boolean(options.template),
    has_backend_framework_arg: Boolean(options.backendFramework),
    has_api_key_arg: Boolean(options.apiKey),
    has_auth_arg: Boolean(options.auth),
    no_install: Boolean(options.noInstall),
    immediate_arg: options.immediate,
  });

  const baseArgs = await resolveArgs(
    {
      name: options.name
        ? { value: options.name }
        : {
            prompt: { type: "input", message: "Project name?", default: "openui-agent" },
            required: true,
          },
      template: options.template
        ? { value: options.template }
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
                  name: "Self-hosted — bring your own provider and self-manage the backend",
                },
              ],
            },
            required: true,
          },
    },
    interactive,
  );

  const { name, template } = baseArgs as { name: string; template: TemplateName };

  const frameworkArgs = await resolveArgs(
    {
      backendFramework:
        options.backendFramework || !interactive
          ? { value: options.backendFramework ?? "none" }
          : {
              prompt: {
                type: "select",
                message: "Choose your backend framework",
                choices: [
                  {
                    value: "none",
                    name: "No framework — OpenAI SDK (default)",
                  },
                  { value: "langgraph", name: "LangGraph" },
                  { value: "vercel-ai-sdk", name: "Vercel AI SDK" },
                ],
              },
              required: true,
            },
    },
    interactive,
  );
  const backendFramework = (frameworkArgs as { backendFramework: BackendFramework })
    .backendFramework;

  const aiSetup = aiSetupFromTemplate(template);
  telemetry.register({ template, ai_setup: aiSetup, backend_framework: backendFramework });
  telemetry.capture("cli_ai_setup_selected", {
    ...createFunnelProps("ai_setup_selected"),
    template,
    ai_setup: aiSetup,
  });
  telemetry.capture("cli_backend_framework_selected", {
    ...createFunnelProps("backend_framework_selected"),
    backend_framework: backendFramework,
    backend_framework_source: options.backendFramework
      ? "flag"
      : interactive
        ? "prompt"
        : "default",
  });

  const targetDir = path.resolve(process.cwd(), name);
  if (fs.existsSync(targetDir)) {
    throw new CreateError(
      "preflight",
      `Directory "${name}" already exists.`,
      "filesystem",
      "TARGET_EXISTS",
    );
  }

  const templateDir = path.join(__dirname, "..", "templates", template);
  if (!fs.existsSync(templateDir)) {
    throw new CreateError(
      "preflight",
      `Template "${template}" not found. Rebuild the CLI with \`pnpm build\`.`,
      "filesystem",
      "TEMPLATE_MISSING",
    );
  }

  telemetry.capture("cli_env_resolution_started", {
    ...createFunnelProps("env_resolution_started"),
    template,
    ai_setup: aiSetup,
  });
  const envResult =
    template === "openui-self-hosted"
      ? await resolveChatEnv(interactive)
      : await resolveCloudEnv(name, options, interactive);

  const installSkill = await shouldInstallSkill(options.skill, interactive);
  telemetry.capture("cli_skill_installed", {
    ...createFunnelProps("skill_prompt_resolved"),
    skill_installed: installSkill,
  });

  const immediateResolution = await resolveImmediate(
    options.immediate,
    options.noInstall,
    interactive,
  );
  const apiKeyEnv = requiredApiKeyEnv(template);
  const apiKeyAvailable = envResult.envWritten || Boolean(process.env[apiKeyEnv]?.trim());
  const devStartBlockedByMissingApiKey = immediateResolution.immediate && !apiKeyAvailable;
  telemetry.capture("cli_immediate_selected", {
    immediate: immediateResolution.immediate,
    dependency_install_requested: immediateResolution.installDependencies,
    selection_source: immediateResolution.source,
  });

  console.info(`\nScaffolding ${template} into "${name}"...\n`);
  telemetry.capture("cli_scaffold_started", {
    ...createFunnelProps("scaffold_started"),
    template,
    ai_setup: aiSetup,
  });
  try {
    fs.cpSync(templateDir, targetDir, {
      recursive: true,
      filter: (src) => shouldCopyTemplatePath(templateDir, src),
    });
    restoreDotfiles(targetDir);
    applyBackendFiles(targetDir, backendFramework);
    rewritePackageJson(targetDir, name, packageManager.name, template, backendFramework);
    // npm ci requires the copied package-lock; other managers resolve from package.json.
    // Framework routes add dependencies at scaffold time, so their npm lock
    // cannot remain frozen; npm install creates a fresh lock for that variant.
    if (packageManager.name !== "npm" || backendFramework !== "none") {
      fs.rmSync(path.join(targetDir, "package-lock.json"), { force: true });
    }
    // The Cloud template ships pnpm's lock/workspace files for reproducible pnpm
    // installs and native-build policy. A framework changes dependencies, so
    // regenerate its lock; non-pnpm scaffolds do not need either pnpm file.
    if (packageManager.name !== "pnpm" || backendFramework !== "none") {
      fs.rmSync(path.join(targetDir, "pnpm-lock.yaml"), { force: true });
    }
    if (packageManager.name !== "pnpm") {
      fs.rmSync(path.join(targetDir, "pnpm-workspace.yaml"), { force: true });
    }
  } catch (err) {
    const properties = cliErrorProperties(err, {
      failure_stage: "scaffold",
      error_class: "filesystem",
      error_code: "SCAFFOLD_FAILED",
    });
    telemetry.capture("cli_scaffold_failed", {
      ...createFunnelProps("scaffold_failed"),
      template,
      ai_setup: aiSetup,
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
    template,
    ai_setup: aiSetup,
  });

  try {
    await writeEnv(
      targetDir,
      envResult,
      template === "openui-cloud" ? buildAppId(name) : undefined,
    );
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

  const frameworkInstall = backendFramework !== "none";
  const installCmd =
    frameworkInstall && packageManager.name === "npm"
      ? "npm install --prefer-offline --no-audit --no-fund --progress=false"
      : frameworkInstall && packageManager.name === "pnpm"
        ? "pnpm install --no-frozen-lockfile"
        : packageManager.installCmd;
  const installArgs =
    frameworkInstall && packageManager.name === "npm"
      ? ["install", "--prefer-offline", "--no-audit", "--no-fund", "--progress=false"]
      : frameworkInstall && packageManager.name === "pnpm"
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
      template,
      ai_setup: aiSetup,
    });
    const installResult = await runCommand(packageManager.runCmd, installArgs, targetDir);
    if (!installResult.error && installResult.status === 0) {
      dependencyInstalled = true;
      telemetry.capture("cli_dependency_install_succeeded", {
        ...createFunnelProps("dependency_install_succeeded"),
        template,
        ai_setup: aiSetup,
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
          template,
          ai_setup: aiSetup,
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
        template,
        ai_setup: aiSetup,
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
      backendFramework,
      skillInstalled,
      envWritten: envResult.envWritten,
      startDev,
      devStartBlockedByMissingApiKey,
      installCmd,
      dependencyInstalled,
    }),
  );

  if (devStartBlockedByMissingApiKey) {
    telemetry.capture("cli_dev_command_skipped", {
      skip_reason: "missing_api_key",
      required_env: apiKeyEnv,
    });
    console.error(
      `Error: Development server not started because ${apiKeyEnv} is missing.\n` +
        `Set ${apiKeyEnv}=… in ${name}/.env, then run:\n\n` +
        `> cd ${name}\n> ${devCmd} run dev\n`,
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
  const devResult = await runCommand(devCmd, ["run", "dev"], targetDir);
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
  options: CreateAppOptions,
  interactive: boolean,
): Promise<EnvResult> {
  let apiKey: string | null = null;
  let authMethod: EnvResult["authMethod"];
  try {
    telemetry.capture("cli_cloud_auth_started", {
      ...createFunnelProps("cloud_auth_started"),
      auth_method: options.auth ?? (options.apiKey ? "apikey-flag" : undefined),
    });
    const resolved = await resolveCloudApiKey({
      apiKey: options.apiKey,
      auth: options.auth,
      projectName: name,
      interactive,
    });
    apiKey = resolved.key;
    authMethod = resolved.method;
    telemetry.capture("cli_cloud_auth_method", {
      ...createFunnelProps("cloud_auth_resolved"),
      auth_method: resolved.method,
      auth_succeeded: apiKey != null,
    });
  } catch (err) {
    if (err instanceof CliCancelledError) {
      telemetry.capture("cli_cloud_auth_cancelled", {
        ...createFunnelProps("cloud_auth_cancelled"),
        auth_method: options.auth ?? (options.apiKey ? "apikey-flag" : undefined),
        auth_succeeded: false,
        ...cliErrorProperties(err),
      });
      throw err;
    }
    const msg = err instanceof Error ? err.message : String(err);
    const properties = cliErrorProperties(err, {
      failure_stage: "cloud_auth",
      error_class: "authentication",
      error_code: "AUTH_FAILED",
    });
    telemetry.capture("cli_cloud_auth_failed", {
      ...createFunnelProps("cloud_auth_failed"),
      auth_method: options.auth ?? (options.apiKey ? "apikey-flag" : undefined),
      auth_succeeded: false,
      ...properties,
    });
    console.error(`\n⚠ Could not obtain an API key: ${msg}`);
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
  backendFramework: BackendFramework;
  skillInstalled: boolean;
  envWritten: boolean;
  startDev: boolean;
  devStartBlockedByMissingApiKey: boolean;
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
    : o.devStartBlockedByMissingApiKey
      ? ""
      : [
          `> cd ${o.name}`,
          ...(o.dependencyInstalled ? [] : [`> ${o.installCmd}`]),
          `> ${o.devCmd} run dev`,
        ].join("\n");

  const frameworkNote =
    o.backendFramework === "langgraph"
      ? o.template === "openui-cloud"
        ? `The generated LangGraph agent uses OpenUI Cloud as its Responses provider. \`${o.devCmd} run dev\` starts both the Agent Server and Next.js; deploy \`langgraph.json\` to LangSmith and point LANGGRAPH_API_URL at it in your frontend deployment.\nAsk "What's the weather in Berlin?" to exercise the included LangGraph tool.`
        : 'The generated API route uses LangGraph.\nAsk "What\'s the weather in Berlin?" to exercise its native tool loop.'
      : o.backendFramework === "vercel-ai-sdk"
        ? o.template === "openui-cloud"
          ? 'The generated Vercel AI SDK route uses OpenUI Cloud as its Responses provider and is deployable as a normal Next.js app on Vercel.\nAsk "What\'s the weather in Berlin?" to exercise the included AI SDK tool.'
          : 'The generated API route uses the Vercel AI SDK.\nAsk "What\'s the weather in Berlin?" to exercise its native tool loop.'
        : "";

  return `${[skillMessage.trim(), "Done!", envNote, frameworkNote, nextStep]
    .filter(Boolean)
    .join("\n\n")}\n`;
}
