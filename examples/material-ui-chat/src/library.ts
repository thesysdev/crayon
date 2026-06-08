/**
 * Entry point for the OpenUI CLI prompt generator.
 *
 * `pnpm generate:prompt` runs `openui generate src/library.ts`, which bundles
 * this file (stubbing asset imports) and reads the `library` + `promptOptions`
 * exports to serialize the system prompt into `src/generated/system-prompt.txt`.
 */
export { muiChatLibrary as library, muiPromptOptions as promptOptions } from "./lib/mui-genui";
