import { execSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import { resolveCloudApiKey, THESYS_KEYS_URL, type CloudAuthMethod } from "../auth/mint";
import { resolveInstallPackageManager } from "../lib/detect-package-manager";
import { runSkillInstall, shouldInstallSkill } from "../lib/install-skill";
import { resolveArgs } from "../lib/resolve-args";
import { CreateError, telemetry } from "../lib/telemetry";

export type TemplateName = "openui-self-hosted" | "openui-cloud";

export interface CreateAppOptions {
  name?: string;
  template?: TemplateName;
  skill?: boolean;
  noInteractive?: boolean;
  noInstall?: boolean;
  // cloud-only
  apiKey?: string;
  auth?: CloudAuthMethod;
}

type AiSetup = "openui_cloud" | "openai_compatible_provider";

type EnvResult = {
  envWritten: boolean;
  envContent?: string;
  authMethod?: CloudAuthMethod | "apikey-flag";
  authSucceeded?: boolean;
};

type ScaffoldStageResult = { ok: true; stagedDir: string } | { ok: false; error: unknown };

const createFunnel = {
  funnel: "cli_create",
  funnel_version: "frontloaded_cloud_setup_v1",
} as const;

const createFunnelSteps = {
  create_started: "0100",
  ai_setup_selected: "0200",
  scaffold_started: "0300",
  scaffold_succeeded: "0310",
  env_resolution_started: "0400",
  cloud_auth_started: "0410",
  cloud_auth_resolved: "0420",
  env_written: "0430",
  skill_prompt_resolved: "0500",
  skill_install_started: "0510",
  skill_install_finished: "0520",
  dependency_install_started: "0600",
  dependency_install_succeeded: "0610",
  dependency_install_failed: "0620",
  create_succeeded: "0700",
  create_failed: "9000",
} as const;

type CreateFunnelStep = keyof typeof createFunnelSteps;

function createFunnelProps(stepKey: CreateFunnelStep): Record<string, string> {
  return {
    ...createFunnel,
    step_rank: createFunnelSteps[stepKey],
    step_key: stepKey,
  };
}

function aiSetupFromTemplate(template: TemplateName): AiSetup {
  return template === "openui-cloud" ? "openui_cloud" : "openai_compatible_provider";
}

function shouldCopyTemplatePath(templateDir: string, src: string): boolean {
  const rel = path.relative(templateDir, src);
  if (!rel) return true;
  const top = rel.split(path.sep)[0] ?? "";
  // never copy install/build artifacts that may sit in a template dir
  return !["node_modules", ".next", ".turbo", "dist"].includes(top);
}

function scaffoldTempPrefix(targetDir: string): string {
  const safeName = path.basename(targetDir).replace(/[^a-zA-Z0-9._-]/g, "-") || "app";
  return path.join(path.dirname(targetDir), `.openui-${safeName}-`);
}

async function stageScaffold(
  templateDir: string,
  targetDir: string,
  name: string,
): Promise<string> {
  let stagedDir: string | undefined;
  try {
    stagedDir = await fs.promises.mkdtemp(scaffoldTempPrefix(targetDir));
    await fs.promises.cp(templateDir, stagedDir, {
      recursive: true,
      filter: (src) => shouldCopyTemplatePath(templateDir, src),
    });
    await rewritePackageJson(stagedDir, name);
    return stagedDir;
  } catch (err) {
    if (stagedDir) await fs.promises.rm(stagedDir, { recursive: true, force: true });
    throw err;
  }
}

async function cleanupStagedScaffold(scaffoldPromise: Promise<ScaffoldStageResult>) {
  const result = await scaffoldPromise;
  if (result.ok) await fs.promises.rm(result.stagedDir, { recursive: true, force: true });
}

async function moveStagedScaffold(stagedDir: string, targetDir: string, name: string) {
  if (fs.existsSync(targetDir)) {
    throw new CreateError("dir_exists", `Directory "${name}" already exists.`);
  }
  await fs.promises.rename(stagedDir, targetDir);
}

async function rewritePackageJson(projectDir: string, name: string) {
  // package.json: set the project name and de-vendor monorepo-local deps
  // (workspace:* / file: / catalog:) to the published "latest". link: deps are
  // rewritten to an absolute file: path so locally-linked packages (e.g.
  // @openuidev/thesys) keep resolving against the developer's checkout under any
  // package manager — npm rejects link:, and ~ isn't expanded. Temporary, until
  // these packages are published.
  const pkgPath = path.join(projectDir, "package.json");
  const pkg = JSON.parse(await fs.promises.readFile(pkgPath, "utf8")) as {
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
  await fs.promises.writeFile(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
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
  });

  const args = await resolveArgs(
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
  );

  const { name, template } = args as { name: string; template: TemplateName };
  const aiSetup = aiSetupFromTemplate(template);
  telemetry.register({ template, ai_setup: aiSetup });
  telemetry.capture("cli_ai_setup_selected", {
    ...createFunnelProps("ai_setup_selected"),
    template,
    ai_setup: aiSetup,
  });

  const targetDir = path.resolve(process.cwd(), name);
  if (fs.existsSync(targetDir)) {
    throw new CreateError("dir_exists", `Directory "${name}" already exists.`);
  }

  const packageManager = resolveInstallPackageManager();
  const templateDir = path.join(__dirname, "..", "templates", template);
  if (!fs.existsSync(templateDir)) {
    throw new CreateError(
      "template_missing",
      `Template "${template}" not found. Rebuild the CLI with \`pnpm build\`.`,
    );
  }

  telemetry.capture("cli_scaffold_started", {
    ...createFunnelProps("scaffold_started"),
    template,
    ai_setup: aiSetup,
  });
  const scaffoldPromise: Promise<ScaffoldStageResult> = stageScaffold(
    templateDir,
    targetDir,
    name,
  ).then(
    (stagedDir) => ({ ok: true, stagedDir }) as const,
    (error) => ({ ok: false, error }) as const,
  );

  let scaffoldCommitted = false;
  let envResult: EnvResult;
  try {
    telemetry.capture("cli_env_resolution_started", {
      ...createFunnelProps("env_resolution_started"),
      template,
      ai_setup: aiSetup,
    });
    envResult =
      template === "openui-self-hosted"
        ? await resolveChatEnv(interactive)
        : await resolveCloudEnv(name, options, interactive);

    console.info(`\nScaffolding ${template} into "${name}"...\n`);
    const scaffoldResult = await scaffoldPromise;
    if (!scaffoldResult.ok) throw scaffoldResult.error;
    await moveStagedScaffold(scaffoldResult.stagedDir, targetDir, name);
    scaffoldCommitted = true;
    telemetry.capture("cli_scaffold_succeeded", {
      ...createFunnelProps("scaffold_succeeded"),
      template,
      ai_setup: aiSetup,
    });

    await writeEnv(targetDir, envResult);
    telemetry.capture("cli_env_resolved", {
      ...createFunnelProps("env_written"),
      template,
      ai_setup: aiSetup,
      env_written: envResult.envWritten,
      auth_method: envResult.authMethod,
      auth_succeeded: envResult.authSucceeded,
    });
  } catch (err) {
    if (!scaffoldCommitted) await cleanupStagedScaffold(scaffoldPromise);
    throw err;
  }

  const installSkill = await shouldInstallSkill(options.skill, interactive);
  telemetry.capture("cli_skill_installed", {
    ...createFunnelProps("skill_prompt_resolved"),
    skill_installed: installSkill,
  });
  if (installSkill) {
    telemetry.capture("cli_skill_install_started", {
      ...createFunnelProps("skill_install_started"),
      skill_installed: installSkill,
    });
    runSkillInstall(targetDir);
    telemetry.capture("cli_skill_install_finished", {
      ...createFunnelProps("skill_install_finished"),
      skill_installed: installSkill,
    });
  }

  const installCmd = packageManager.installCmd;
  let dependencyInstalled = false;

  if (options.noInstall) {
    console.info(`Skipping dependency install (--no-install). Run \`${installCmd}\` later.\n`);
  } else {
    console.info(`Installing dependencies with: ${installCmd}\n`);
    telemetry.capture("cli_dependency_install_started", {
      ...createFunnelProps("dependency_install_started"),
      template,
      ai_setup: aiSetup,
    });
    try {
      execSync(installCmd, { stdio: "inherit", cwd: targetDir });
      dependencyInstalled = true;
      telemetry.capture("cli_dependency_install_succeeded", {
        ...createFunnelProps("dependency_install_succeeded"),
        template,
        ai_setup: aiSetup,
        dependency_installed: dependencyInstalled,
      });
    } catch {
      telemetry.capture("cli_dependency_install_failed", {
        ...createFunnelProps("dependency_install_failed"),
        template,
        ai_setup: aiSetup,
        dependency_installed: dependencyInstalled,
      });
      throw new CreateError("install_deps", "dependency install failed");
    }
  }

  const devCmd = packageManager.runCmd;

  telemetry.capture("cli_create_succeeded", {
    ...createFunnelProps("create_succeeded"),
    template,
    ai_setup: aiSetup,
    duration_ms: Date.now() - t0,
    skill_installed: installSkill,
    env_written: envResult.envWritten,
    dependency_installed: dependencyInstalled,
  });
  console.info(
    getStartedMessage({
      name,
      devCmd,
      template,
      skillInstalled: installSkill,
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
  let authMethod: CloudAuthMethod | "apikey-flag" | undefined;
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
    const msg = err instanceof Error ? err.message : String(err);
    telemetry.capture("cli_cloud_auth_failed", {
      ...createFunnelProps("cloud_auth_resolved"),
      auth_method: options.auth ?? (options.apiKey ? "apikey-flag" : undefined),
      auth_succeeded: false,
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
        ? "✅ .env created with your OpenUI Cloud API key."
        : `⚠ .env created without a key. Add THESYS_API_KEY=… (get one at ${THESYS_KEYS_URL}).`
      : o.envWritten
        ? "✅ .env created with your provider API key."
        : "Add your provider API key to .env:\nOPENAI_API_KEY=your-provider-key-here";

  return `${skillMessage}
Done!

${envNote}

> cd ${o.name}
> ${o.devCmd} run dev
`;
}
