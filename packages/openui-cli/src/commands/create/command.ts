import { Command } from "commander";

import { context } from "../../lib/context";
import { rejectConflictingScaffoldSelectors } from "./lib/examples-catalog";
import { printCreateHelp } from "./lib/help";
import { rejectConflictingImmediateFlags } from "./lib/resolve";

import { runCreateApp } from "./run";

export const createCommand = new Command("create")
  .description(
    "Scaffold a generative UI agent with Next.js and your choice of agent framework.\n" +
      "No account or API key is needed to scaffold. Add the key afterwards:\n" +
      "  openui generate-api-key",
  )
  .option("-n, --name <string>", "Project name (default: openui-agent)")
  .option("--backend-framework <framework>", "Backend framework to use (default: langgraph)")
  .option("-e, --example <example>", "Create from an example in examples/examples.json")
  .option("--skill", "Install the OpenUI agent skill for AI coding assistants")
  .option("--no-skill", "Skip installing the OpenUI agent skill")
  .option("--no-interactive", "Never prompt; use defaults for anything not passed")
  .option("--no-install", "Scaffold without running the package install")
  .option("-i, --immediate", "Start the development server after installing dependencies")
  .option("--no-immediate", "Install dependencies without starting the development server")
  .helpOption(false)
  .option("-h, --help", "display help for command")
  .action(
    async (options: {
      name?: string;
      backendFramework?: string;
      example?: string;
      skill?: boolean;
      interactive: boolean;
      install: boolean;
      immediate?: boolean;
      help?: boolean;
    }) => {
      if (options.help) {
        await printCreateHelp(createCommand);
        return;
      }

      rejectConflictingImmediateFlags(context.argv.slice(2));
      rejectConflictingScaffoldSelectors({
        example: options.example,
        backendFramework: options.backendFramework,
      });

      await runCreateApp(
        {
          name: options.name,
          backendFramework: options.backendFramework,
          example: options.example,
          skill: options.skill,
          noInstall: !options.install,
          immediate: options.immediate,
        },
        context,
      );
    },
  );

// `openui help create` calls help() (sync) then, if it doesn't exit, dispatches `--help`.
createCommand.help = (() => undefined) as Command["help"];
