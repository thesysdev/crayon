import { execSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import { resolveCloudApiKey, THESYS_KEYS_URL, type CloudAuthMethod } from "../auth/mint";
import { detectPackageManager } from "../lib/detect-package-manager";
import { runSkillInstall, shouldInstallSkill } from "../lib/install-skill";
import { resolveArgs } from "../lib/resolve-args";
import { CreateError, telemetry } from "../lib/telemetry";

export type TemplateName = "openui-chat" | "openui-cloud";

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

function shouldCopyTemplatePath(templateDir: string, src: string): boolean {
  const rel = path.relative(templateDir, src);
  if (!rel) return true;
  const top = rel.split(path.sep)[0] ?? "";
  // never copy install/build artifacts that may sit in a template dir
  return !["node_modules", ".next", ".turbo", "dist"].includes(top);
}

export async function runCreateApp(options: CreateAppOptions): Promise<void> {
  const interactive = !options.noInteractive;
  const t0 = Date.now();
  telemetry.register({ is_interactive: interactive });

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
              message: "Which template?",
              choices: [
                { value: "openui-chat", name: "OpenUI Chat — bring your own model key (OpenAI)" },
                {
                  value: "openui-cloud",
                  name: "OpenUI Cloud — managed conversations, artifacts & streaming",
                },
              ],
            },
            required: true,
          },
    },
    interactive,
  );

  const { name, template } = args as { name: string; template: TemplateName };
  telemetry.register({ template });
  telemetry.capture("cli_create_started", { interactive });
  telemetry.capture("cli_template_selected", { template });

  const targetDir = path.resolve(process.cwd(), name);
  if (fs.existsSync(targetDir)) {
    throw new CreateError("dir_exists", `Directory "${name}" already exists.`);
  }

  const runner = detectPackageManager();
  telemetry.register({ package_manager: runner });
  const templateDir = path.join(__dirname, "..", "templates", template);
  if (!fs.existsSync(templateDir)) {
    throw new CreateError(
      "template_missing",
      `Template "${template}" not found. Rebuild the CLI with \`pnpm build\`.`,
    );
  }

  console.info(`\nScaffolding ${template} into "${name}"...\n`);
  fs.cpSync(templateDir, targetDir, {
    recursive: true,
    filter: (src) => shouldCopyTemplatePath(templateDir, src),
  });

  // package.json: set the project name and de-vendor monorepo-local deps
  // (workspace:* / file: / catalog:) to the published "latest". link: deps are
  // rewritten to an absolute file: path so locally-linked packages (e.g.
  // @openuidev/thesys) keep resolving against the developer's checkout under any
  // package manager — npm rejects link:, and ~ isn't expanded. Temporary, until
  // these packages are published.
  const pkgPath = path.join(targetDir, "package.json");
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

  const installCmd =
    runner === "pnpm dlx"
      ? "pnpm install"
      : runner === "yarn dlx"
        ? "yarn"
        : runner === "bunx"
          ? "bun install"
          : "npm install";

  if (options.noInstall) {
    console.info(`Skipping dependency install (--no-install). Run \`${installCmd}\` later.\n`);
  } else {
    console.info(`Installing dependencies with: ${installCmd}\n`);
    try {
      execSync(installCmd, { stdio: "inherit", cwd: targetDir });
    } catch {
      throw new CreateError("install_deps", "dependency install failed");
    }
  }

  const installSkill = await shouldInstallSkill(options.skill, interactive);
  telemetry.capture("cli_skill_installed", { installed: installSkill });
  if (installSkill) runSkillInstall(targetDir);

  const envWritten =
    template === "openui-cloud"
      ? await writeCloudEnv(targetDir, name, options, interactive)
      : await writeChatEnv(targetDir, interactive);

  const devCmd =
    runner === "pnpm dlx"
      ? "pnpm"
      : runner === "yarn dlx"
        ? "yarn"
        : runner === "bunx"
          ? "bun"
          : "npm";

  telemetry.capture("cli_create_succeeded", {
    template,
    duration_ms: Date.now() - t0,
    skill_installed: installSkill,
    env_written: envWritten,
  });
  console.info(
    getStartedMessage({ name, devCmd, template, skillInstalled: installSkill, envWritten }),
  );
}

async function writeChatEnv(targetDir: string, interactive: boolean): Promise<boolean> {
  if (!interactive) return false;
  const { input } = await import("@inquirer/prompts");
  const apiKey = (
    await input({ message: "Enter your OpenAI API key (leave blank to skip):" })
  ).trim();
  if (!apiKey) return false;
  fs.writeFileSync(path.join(targetDir, ".env"), `OPENAI_API_KEY=${apiKey}\n`);
  return true;
}

async function writeCloudEnv(
  targetDir: string,
  name: string,
  options: CreateAppOptions,
  interactive: boolean,
): Promise<boolean> {
  let apiKey: string | null = null;
  try {
    const resolved = await resolveCloudApiKey({
      apiKey: options.apiKey,
      auth: options.auth,
      projectName: name,
      interactive,
    });
    apiKey = resolved.key;
    telemetry.capture("cli_cloud_auth_method", {
      method: resolved.method,
      succeeded: apiKey != null,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`\n⚠ Could not obtain an API key: ${msg}`);
    console.error(`  Add THESYS_API_KEY to .env later (keys: ${THESYS_KEYS_URL}).\n`);
  }
  const lines = [`THESYS_API_KEY=${apiKey ?? ""}`, `DEMO_USER_ID=demo-user`];
  fs.writeFileSync(path.join(targetDir, ".env"), lines.join("\n") + "\n");
  return apiKey != null;
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
