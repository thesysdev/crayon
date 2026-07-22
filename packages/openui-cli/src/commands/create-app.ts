import { execSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import { resolveCloudApiKey, THESYS_KEYS_URL } from "../auth/mint";
import { aiSetupFromTemplate, createFunnelProps } from "../lib/create-telemetry";
import type { CreateAppOptions, EnvResult, TemplateName } from "../lib/create-types";
import { resolveInstallPackageManager } from "../lib/detect-package-manager";
import { runSkillInstall, shouldInstallSkill } from "../lib/install-skill";
import { resolveArgs } from "../lib/resolve-args";
import { CreateError, telemetry } from "../lib/telemetry";

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
  const packageManager = resolveInstallPackageManager();
  const t0 = Date.now();
  telemetry.register({ interactive, package_manager: packageManager.name });
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

  const templateDir = path.join(__dirname, "..", "templates", template);
  if (!fs.existsSync(templateDir)) {
    throw new CreateError(
      "template_missing",
      `Template "${template}" not found. Rebuild the CLI with \`pnpm build\`.`,
    );
  }

  const captureScaffoldFailed = () => {
    telemetry.capture("cli_scaffold_failed", {
      ...createFunnelProps("scaffold_failed"),
      template,
      ai_setup: aiSetup,
    });
  };

  telemetry.capture("cli_env_resolution_started", {
    ...createFunnelProps("env_resolution_started"),
    template,
    ai_setup: aiSetup,
  });
  const envResult =
    template === "openui-self-hosted"
      ? await resolveChatEnv(interactive)
      : await resolveCloudEnv(name, options, interactive);

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
    rewritePackageJson(targetDir, name);
    // The template lockfile enables npm ci; other managers should resolve from package.json.
    if (packageManager.name !== "npm") {
      fs.rmSync(path.join(targetDir, "package-lock.json"), { force: true });
    }
  } catch (err) {
    captureScaffoldFailed();
    throw err;
  }
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
