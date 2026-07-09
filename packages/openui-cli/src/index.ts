#!/usr/bin/env node

import * as fs from "node:fs";
import * as path from "node:path";

import { Command } from "commander";

import { runCreateApp } from "./commands/create-app";
import { runGenerate } from "./commands/generate";
import { resolveArgs } from "./lib/resolve-args";
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

// Init telemetry once, just before any command runs (honors --no-telemetry / DO_NOT_TRACK).
program.hook("preAction", (_thisCommand, actionCommand) => {
  telemetry.init({ cliVersion, flagEnabled: program.opts()["telemetry"] !== false });
  telemetry.capture("cli_invoked", { command: actionCommand.name() });
});

program
  .command("create")
  .description("Scaffold a new Next.js app with OpenUI Cloud or your provider")
  .option("-n, --name <string>", "Project name")
  .option("-t, --template <template>", "AI setup: openui-cloud | openui-self-hosted")
  .option("--api-key <key>", "OpenUI Cloud API key (cloud template; skips sign-in)")
  .option("--auth <method>", "Cloud auth method: oauth | manual | skip")
  .option("--skill", "Install the OpenUI agent skill for AI coding assistants")
  .option("--no-skill", "Skip installing the OpenUI agent skill")
  .option("--no-interactive", "Fail with error if required args are missing")
  .option("--no-install", "Scaffold without running the package install")
  .action(
    async (options: {
      name?: string;
      template?: string;
      apiKey?: string;
      auth?: string;
      skill?: boolean;
      interactive: boolean;
      install: boolean;
    }) => {
      try {
        await runCreateApp({
          name: options.name,
          template: normalizeTemplate(options.template),
          apiKey: options.apiKey,
          auth: normalizeAuth(options.auth),
          skill: options.skill,
          noInteractive: !options.interactive,
          noInstall: !options.install,
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
  .description("Generate system prompt or JSON schema from a library definition")
  .argument("[entry]", "Path to a file that exports a createLibrary() result")
  .option("-o, --out <file>", "Write output to a file instead of stdout")
  .option(
    "--json-schema",
    "Output JSON schema with component signatures for standalone prompt generation",
  )
  .option("--export <name>", "Name of the export to use (auto-detected by default)")
  .option(
    "--prompt-options <name>",
    "Name of the PromptOptions export to use (auto-detected by default)",
  )
  .option("--no-interactive", "Fail with error if required args are missing")
  .action(
    async (
      entry: string | undefined,
      options: {
        out?: string;
        jsonSchema?: boolean;
        export?: string;
        promptOptions?: string;
        interactive: boolean;
      },
    ) => {
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
    },
  );

program
  .command("generate-spec")
  .description("Generate a serialized library spec JSON (signatures, groups, JSON schema)")
  .argument("[entry]", "Path to a file that exports a createLibrary() result")
  .option("-o, --out <file>", "Write output to a file instead of stdout")
  .option("--export <name>", "Name of the export to use (auto-detected by default)")
  .option("--no-interactive", "Fail with error if required args are missing")
  .action(
    async (
      entry: string | undefined,
      options: {
        out?: string;
        export?: string;
        interactive: boolean;
      },
    ) => {
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

        await runGenerate((args as { entry: string }).entry, { ...options, spec: true });
      } catch (e) {
        handleCliError(e, "cli_generate_spec_failed");
      } finally {
        await telemetry.shutdown();
      }
    },
  );

program.parse();
