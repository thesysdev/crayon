#!/usr/bin/env node

import { Command } from "commander";

import { runCreateChatApp } from "./commands/create-chat-app";

const program = new Command();

program.name("create-openui-app").description("CLI for creating OpenUI apps").version("0.0.1");

program
  .command("chat")
  .description("Scaffold a new Next.js app with OpenUI Chat")
  .option("-n, --name <string>", "Project name")
  .option("--no-interactive", "Fail with error if required args are missing")
  .action(async (options: { name?: string; interactive: boolean }) => {
    await runCreateChatApp({ name: options.name, noInteractive: !options.interactive });
  });

program.parse();
