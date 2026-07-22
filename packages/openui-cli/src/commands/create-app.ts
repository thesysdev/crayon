import { randomUUID } from "node:crypto";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import { resolveCloudApiKey, THESYS_KEYS_URL } from "../auth/mint";
import {
  aiSetupFromTemplate,
  captureCreateStageSkipped,
  createFunnelProps,
  instrumentCreateStage,
} from "../lib/create-telemetry";
import type { CreateAppOptions, EnvResult, TemplateName } from "../lib/create-types";
import {
  resolveInstallPackageManager,
  resolvePackageManagerVersion,
} from "../lib/detect-package-manager";
import { normalizeCliError } from "../lib/error-reporting";
import {
  printSkillInstallFailure,
  runSkillInstall,
  shouldInstallSkill,
} from "../lib/install-skill";
import { resolveArgs } from "../lib/resolve-args";
import { runCommand } from "../lib/run-command";
import { CliCancellation, CreateError, telemetry } from "../lib/telemetry";

function shouldCopyTemplatePath(templateDir: string, src: string): boolean {
  const rel = path.relative(templateDir, src);
  if (!rel) return true;
  const top = rel.split(path.sep)[0] ?? "";
  // never copy install/build artifacts that may sit in a template dir
  return !["node_modules", ".next", ".turbo", "dist"].includes(top);
}

function rewritePackageJson(projectDir: string, name: string) {
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
  };
  pkg.name = name;
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
}

export async function runCreateApp(options: CreateAppOptions): Promise<void> {
  const interactive = !options.noInteractive;
  const t0 = Date.now();
  telemetry.register({ interactive, create_attempt_id: randomUUID() });
  telemetry.capture("cli_create_started", {
    ...createFunnelProps("create_started"),
    interactive,
    has_name_arg: Boolean(options.name),
    has_template_arg: Boolean(options.template),
    has_api_key_arg: Boolean(options.apiKey),
    has_auth_arg: Boolean(options.auth),
    no_install: Boolean(options.noInstall),
  });

  const args = await instrumentCreateStage(
    "args_resolution",
    () =>
      resolveArgs(
        {
          name: options.name
            ? { value: options.name }
            : { prompt: { type: "input", message: "Project name?" }, required: true },
          template: options.template
            ? { value: options.template }
            : {
                prompt: {
                  type: "select",
                  message: "Choose your AI setup",
                  choices: [
                    {
                      value: "openui-cloud",
                      name: "OpenUI Cloud — fastest setup with free hosted models (recommended)",
                    },
                    {
                      value: "openui-self-hosted",
                      name: "OpenAI-compatible provider — use your own key and self-host the AI route",
                    },
                  ],
                },
                required: true,
              },
        },
        interactive,
      ),
    { properties: { interactive } },
  );

  const { name, template } = args as { name: string; template: TemplateName };
  const aiSetup = aiSetupFromTemplate(template);
  const stageContext = { template, ai_setup: aiSetup };
  telemetry.register({ template, ai_setup: aiSetup });
  telemetry.capture("cli_ai_setup_selected", {
    ...createFunnelProps("ai_setup_selected"),
    template,
    ai_setup: aiSetup,
  });

  const { targetDir, packageManager, packageManagerVersion, templateDir } =
    await instrumentCreateStage(
      "preflight",
      () => {
        const resolvedTargetDir = path.resolve(process.cwd(), name);
        if (fs.existsSync(resolvedTargetDir)) {
          throw new CreateError("dir_exists", `Directory "${name}" already exists.`);
        }

        const resolvedPackageManager = resolveInstallPackageManager();
        const resolvedPackageManagerVersion = resolvePackageManagerVersion(
          resolvedPackageManager.name,
        );
        const resolvedTemplateDir = path.join(__dirname, "..", "templates", template);
        if (!fs.existsSync(resolvedTemplateDir)) {
          throw new CreateError(
            "template_missing",
            `Template "${template}" not found. Rebuild the CLI with \`pnpm build\`.`,
          );
        }
        return {
          targetDir: resolvedTargetDir,
          packageManager: resolvedPackageManager,
          packageManagerVersion: resolvedPackageManagerVersion,
          templateDir: resolvedTemplateDir,
        };
      },
      {
        properties: stageContext,
        resultProperties: (result) => ({
          package_manager: result.packageManager.name,
          ...(result.packageManagerVersion
            ? { package_manager_version: result.packageManagerVersion }
            : {}),
        }),
      },
    );
  telemetry.register({
    package_manager: packageManager.name,
    ...(packageManagerVersion ? { package_manager_version: packageManagerVersion } : {}),
  });

  const captureScaffoldFailed = (error: unknown) => {
    telemetry.capture("cli_scaffold_failed", {
      ...createFunnelProps("scaffold_failed"),
      ...stageContext,
      ...normalizeCliError(error),
    });
  };

  telemetry.capture("cli_env_resolution_started", {
    ...createFunnelProps("env_resolution_started"),
    template,
    ai_setup: aiSetup,
  });
  const envResult = await instrumentCreateStage(
    "environment_resolution",
    () =>
      template === "openui-self-hosted"
        ? resolveChatEnv(interactive)
        : resolveCloudEnv(name, options, interactive),
    {
      properties: stageContext,
      resultProperties: (result) => ({
        env_written: result.envWritten,
        auth_method: result.authMethod,
        auth_succeeded: result.authSucceeded,
      }),
    },
  );

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
        rewritePackageJson(targetDir, name);
      } catch (error) {
        captureScaffoldFailed(error);
        throw error;
      }
      telemetry.capture("cli_scaffold_succeeded", {
        ...createFunnelProps("scaffold_succeeded"),
        ...stageContext,
      });
    },
    { properties: stageContext },
  );

  await instrumentCreateStage("environment_write", () => writeEnv(targetDir, envResult), {
    properties: stageContext,
    resultProperties: () => ({
      env_written: envResult.envWritten,
      auth_method: envResult.authMethod,
      auth_succeeded: envResult.authSucceeded,
    }),
  });
  telemetry.capture("cli_env_resolved", {
    ...createFunnelProps("env_written"),
    ...stageContext,
    env_written: envResult.envWritten,
    auth_method: envResult.authMethod,
    auth_succeeded: envResult.authSucceeded,
  });

  const installSkillRequested = await instrumentCreateStage(
    "skill_prompt",
    () => shouldInstallSkill(options.skill, interactive),
    {
      properties: stageContext,
      resultProperties: (requested) => ({ skill_install_requested: requested }),
    },
  );
  telemetry.capture("cli_skill_installed", {
    ...createFunnelProps("skill_prompt_resolved"),
    skill_installed: installSkillRequested,
    skill_install_requested: installSkillRequested,
  });

  let skillInstalled = false;
  if (installSkillRequested) {
    telemetry.capture("cli_skill_install_started", {
      ...createFunnelProps("skill_install_started"),
      skill_install_requested: true,
    });
    try {
      await instrumentCreateStage("skill_install", () => runSkillInstall(targetDir), {
        properties: stageContext,
      });
      skillInstalled = true;
      telemetry.capture("cli_skill_install_finished", {
        ...createFunnelProps("skill_install_finished"),
        skill_installed: true,
      });
    } catch (error) {
      telemetry.capture("cli_skill_install_failed", {
        ...createFunnelProps("skill_install_finished"),
        skill_installed: false,
        ...normalizeCliError(error),
      });
      printSkillInstallFailure();
    }
  } else {
    captureCreateStageSkipped("skill_install", "not_requested", stageContext);
  }

  const installCmd = packageManager.installCmd;
  let dependencyInstalled = false;

  if (options.noInstall) {
    captureCreateStageSkipped("dependency_install", "no_install_flag", stageContext);
    console.info(`Skipping dependency install (--no-install). Run \`${installCmd}\` later.\n`);
  } else {
    console.info(`Installing dependencies with: ${installCmd}\n`);
    telemetry.capture("cli_dependency_install_started", {
      ...createFunnelProps("dependency_install_started"),
      ...stageContext,
    });
    try {
      await instrumentCreateStage(
        "dependency_install",
        () => runCommand(packageManager.name, packageManager.installArgs, targetDir),
        { properties: stageContext },
      );
      dependencyInstalled = true;
      telemetry.capture("cli_dependency_install_succeeded", {
        ...createFunnelProps("dependency_install_succeeded"),
        ...stageContext,
        dependency_installed: dependencyInstalled,
      });
    } catch (error) {
      telemetry.capture("cli_dependency_install_failed", {
        ...createFunnelProps("dependency_install_failed"),
        ...stageContext,
        dependency_installed: dependencyInstalled,
        ...normalizeCliError(error),
      });
      if (error instanceof CreateError) throw error;
      throw new CreateError("dependency_install", "dependency install failed", { cause: error });
    }
  }

  const devCmd = packageManager.runCmd;

  telemetry.capture("cli_create_succeeded", {
    ...createFunnelProps("create_succeeded"),
    ...stageContext,
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
    }),
  );
}

async function writeEnv(targetDir: string, result: EnvResult): Promise<void> {
  if (!result.envContent) return;
  await fs.promises.writeFile(path.join(targetDir, ".env"), result.envContent);
}

async function resolveChatEnv(interactive: boolean): Promise<EnvResult> {
  if (!interactive) return { envWritten: false };
  const { input } = await import("@inquirer/prompts");
  const apiKey = (
    await input({
      message: "Enter your OpenAI-compatible provider API key (leave blank to skip):",
    })
  ).trim();
  if (!apiKey) return { envWritten: false };
  return { envWritten: true, envContent: `OPENAI_API_KEY=${apiKey}\n` };
}

async function resolveCloudEnv(
  name: string,
  options: CreateAppOptions,
  interactive: boolean,
): Promise<EnvResult> {
  let apiKey: string | null = null;
  let authMethod: EnvResult["authMethod"];
  const requestedAuthMethod = options.auth ?? (options.apiKey ? "apikey-flag" : undefined);
  try {
    telemetry.capture("cli_cloud_auth_started", {
      ...createFunnelProps("cloud_auth_started"),
      ...(requestedAuthMethod ? { auth_method: requestedAuthMethod } : {}),
    });
    const resolved = await instrumentCreateStage(
      "cloud_auth",
      () =>
        resolveCloudApiKey({
          apiKey: options.apiKey,
          auth: options.auth,
          projectName: name,
          interactive,
        }),
      {
        properties: { auth_method_requested: requestedAuthMethod },
        resultStatus: (result) => (result.method === "skip" ? "skipped" : "succeeded"),
        resultProperties: (result) => ({
          auth_method: result.method,
          auth_succeeded: result.key != null,
        }),
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
    if (err instanceof CliCancellation) throw err;
    const msg = err instanceof Error ? err.message : String(err);
    telemetry.capture("cli_cloud_auth_failed", {
      ...createFunnelProps("cloud_auth_resolved"),
      ...(requestedAuthMethod ? { auth_method: requestedAuthMethod } : {}),
      auth_succeeded: false,
      failure_stage: err instanceof CreateError ? err.stage : "cloud_auth",
      ...normalizeCliError(err),
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
  skillInstalled: boolean;
  envWritten: boolean;
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

  return `${skillMessage}
Done!

${envNote}

> cd ${o.name}
> ${o.devCmd} run dev
`;
}
