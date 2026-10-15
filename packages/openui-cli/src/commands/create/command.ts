import { Command } from "commander";

import { context } from "../../lib/context";
import { CreateError } from "../../lib/errors";
import { rejectConflictingScaffoldSelectors } from "./lib/examples-catalog";
import { printCreateHelp } from "./lib/help";
import { rejectConflictingImmediateFlags } from "./lib/resolve";

import { runCreateApp } from "./run";

export const createCommand = new Command("create")
  .summary("Scaffold a generative UI agent with Next.js and your choice of agent framework")
  .description(
    "Scaffold a generative UI agent with Next.js and your choice of agent framework.\n" +
      "No account or API key is needed to scaffold. Add the key afterwards:\n" +
      "  openui generate-api-key",
  )
  .argument("[directory]", "Folder to create the project in; . uses the current folder")
  .option("-n, --name <string>", "Project name (default: openui-agent)")
  .option("--backend-framework <framework>", "Backend framework to use (default: langgraph)")
  .option("-e, --example <example>", "Create from an example in examples/examples.json")
  .option("--no-skill", "Don't add AGENTS.md (the OpenUI skill for coding agents) to the project")
  .option("--no-interactive", "Never prompt; use defaults for anything not passed")
  .option("--no-install", "Scaffold without running the package install")
  .option("-i, --immediate", "Start the development server after installing dependencies")
  .option("--no-immediate", "Install dependencies without starting the development server")
  .helpOption(false)
  .option("-h, --help", "display help for command")
  .action(
    async (
      directory: string | undefined,
      options: {
        name?: string;
        backendFramework?: string;
        example?: string;
        skill: boolean;
        interactive: boolean;
        install: boolean;
        immediate?: boolean;
        help?: boolean;
      },
    ) => {
      if (options.help) {
        await printCreateHelp(createCommand);
        return;
      }

      rejectConflictingImmediateFlags(context.argv.slice(2));
      if (directory && options.name) {
        throw new CreateError(
          "bad_args",
          "Pass the project folder either as an argument or with --name, not both.",
          "invalid_input",
          "CONFLICTING_NAME_ARGS",
        );
      }
      rejectConflictingScaffoldSelectors({
        example: options.example,
        backendFramework: options.backendFramework,
      });

      await runCreateApp(
        {
          name: directory ?? options.name,
          backendFramework: options.backendFramework,
          example: options.example,
          noInstall: !options.install,
          noSkill: !options.skill,
          immediate: options.immediate,
        },
        context,
      );
    },
  );

// `openui help create` calls help() (sync) then, if it doesn't exit, dispatches `--help`.
createCommand.help = (() => undefined) as Command["help"];
