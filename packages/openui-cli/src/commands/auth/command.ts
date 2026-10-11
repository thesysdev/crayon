import { Command, Option } from "commander";

import { context } from "../../lib/context";

import { runAuthLogin, runAuthLogout, runAuthWait } from "./run";

const jsonOption = () => new Option("--json", "Print machine-readable JSON");

const loginCommand = new Command("login")
  .description("Sign in to Thesys so commands can mint API keys without opening the browser again")
  .addOption(jsonOption())
  .addOption(new Option("--background-child").hideHelp())
  .addHelpText(
    "after",
    `
In a terminal, this opens the browser and waits for you to sign in.

When run by a coding agent (or without a TTY), it starts the sign-in in the
background and prints the link right away. Show the link to the user, then run
\`openui auth wait\` until it succeeds.

Exit codes for \`openui auth wait\`: 0 = signed in, 75 = still waiting (run it again).
`,
  )
  .action(async (options: { json?: boolean; backgroundChild?: boolean }) => {
    await runAuthLogin(options, context);
  });

const waitCommand = new Command("wait")
  .description("Wait for a sign-in started by `openui auth login` (exits 75 if still pending)")
  .option("-t, --timeout <seconds>", "How long to wait before exiting with code 75", "60")
  .addOption(jsonOption())
  .action(async (options: { json?: boolean; timeout: string }) => {
    await runAuthWait(options);
  });

const logoutCommand = new Command("logout")
  .description("Forget the saved Thesys sign-in")
  .addOption(jsonOption())
  .action((options: { json?: boolean }) => {
    runAuthLogout(options);
  });

export const authCommand = new Command("auth")
  .description("Sign in to Thesys for API key generation")
  .addCommand(loginCommand)
  .addCommand(waitCommand)
  .addCommand(logoutCommand);
