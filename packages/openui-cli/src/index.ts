#!/usr/bin/env node

import { randomUUID } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";

import { Command } from "commander";

import { runCreateApp } from "./commands/create-app";
import { GenerateOptions, runGenerate } from "./commands/generate";
import { detectAgent, UNKNOWN_AGENT_NAME } from "./lib/detect-agent";
import { rejectConflictingImmediateFlags, resolveArgs } from "./lib/resolve-args";
import { telemetry } from "./lib/telemetry";
import { handleCliError, normalizeAuth, normalizeTemplate } from "./lib/utils"; // Ensure utils.ts is included for type declarations

const program = new Command();

const cliVersion = (
  JSON.parse(fs.readFileSync(path.join(__dirname, "..", "package.json"), "utf8")) as {
    version: string;
  }
).version;

program.name("openui").description("CLI for OpenUI").version(cliVersion);
program.option("--no-telemetry", "Disable anonymous usage analytics");

program.option(
  "--agent-name <name>",
  "AI agents: declare your stable lowercase kebab-case product slug for telemetry (e.g. codex or claude-code); humans can omit",
  UNKNOWN_AGENT_NAME,
);
program.configureHelp({ showGlobalOptions: true });

// Init telemetry once, just before any command runs (honors --no-telemetry / DO_NOT_TRACK).
program.hook("preAction", (_thisCommand, actionCommand) => {
  const globalOptions = program.opts<{ agentName: string; telemetry?: boolean }>();
  const command = actionCommand.name();
  telemetry.init({ cliVersion, flagEnabled: globalOptions.telemetry !== false });
  telemetry.register({
    agent_name: globalOptions.agentName,
    detected_agent_name: detectAgent(),
    cli_run_id: randomUUID(),
    command,
  });
  telemetry.capture("cli_invoked");
});

program
  .command("create")
  .description(
    "Scaffold a Next.js agent app with the recommended OpenUI Cloud backend or your own provider",
  )
  .option("-n, --name <string>", "Project name (interactive default: openui-agent)")
  .option(
    "-t, --template <template>",
    "AI backend: openui-cloud (recommended default) | openui-self-hosted (infrastructure control)",
  )
  .option("--api-key <key>", "OpenUI Cloud API key (cloud template; skips sign-in)")
  .option("--auth <method>", "Cloud auth method: oauth | skip (manual is deprecated)")
  .option("--skill", "Install the OpenUI agent skill for AI coding assistants")
  .option("--no-skill", "Skip installing the OpenUI agent skill")
  .option("--no-interactive", "Fail with error if required args are missing")
  .option("--no-install", "Scaffold without running the package install")
  .option("-i, --immediate", "Start the development server after installing dependencies")
  .option("--no-immediate", "Install dependencies without starting the development server")
  .addHelpText(
    "after",
    `
Templates:
  openui-cloud        Recommended default for prototypes and evaluations.
                      Hosted models, managed conversation history, built-in tools,
                      and ready-to-use reports and presentations. No model, storage,
                      or artifact infrastructure to operate. Bring your own
                      OpenAI/Anthropic/Google key (BYOK) on any plan,
                      including the free tier.
  openui-self-hosted  Choose when owning the OpenAI-compatible provider, AI route,
                      and persistence is a requirement.
`,
  )
  .action(
    async (options: {
      name?: string;
      template?: string;
      apiKey?: string;
      auth?: string;
      skill?: boolean;
      interactive: boolean;
      install: boolean;
      immediate?: boolean;
    }) => {
      try {
        rejectConflictingImmediateFlags(process.argv.slice(2));
        await runCreateApp({
          name: options.name,
          template: normalizeTemplate(options.template),
          apiKey: options.apiKey,
          auth: normalizeAuth(options.auth),
          skill: options.skill,
          noInteractive: !options.interactive,
          noInstall: !options.install,
          immediate: options.immediate,
        });
      } catch (e) {
        handleCliError(e, "cli_create_failed");
      } finally {
        await telemetry.shutdown();
      }
    },
  );

program
  .command("generate")
  .description("Generate the system prompt + serialized spec from a library definition")
  .argument("[entry]", "Path to a file that exports a createLibrary() result")
  .option(
    "-o, --out <file>",
    "Write the prompt to a file; the spec JSON lands alongside with .spec.json extension",
  )
  .option(
    "--json-schema",
    "Output JSON schema with component signatures for standalone prompt generation",
  )
  .option("--spec", "Generate a serialized library spec JSON (signatures, groups, JSON schema)")
  .option("--export <name>", "Name of the export to use (auto-detected by default)")
  .option(
    "--prompt-options <name>",
    "Name of the PromptOptions export to use (auto-detected by default)",
  )
  .option("--no-interactive", "Fail with error if required args are missing")
  .action(async (entry: string | undefined, options: GenerateOptions) => {
    try {
      const args = await resolveArgs(
        {
          entry: entry
            ? { value: entry }
            : {
                prompt: { type: "input", message: "Entry file path?" },
                required: true,
              },
        },
        options.interactive,
      );

      await runGenerate((args as { entry: string }).entry, options);
    } catch (e) {
      handleCliError(e, "cli_generate_failed");
    } finally {
      await telemetry.shutdown();
    }
  });

program.parse();
