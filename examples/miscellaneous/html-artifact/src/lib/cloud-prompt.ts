import { generateSystemPrompt, type ChatLibrary } from "@openuidev/thesys-server";
import { readFileSync } from "fs";
import { join } from "path";
import { promptOptions } from "./prompt-options";

/** Load the generated library spec and wrap it in Cloud's managed prompt block. */
export function cloudInstructions(): string {
  const library = JSON.parse(
    readFileSync(join(process.cwd(), "src/generated/spec.json"), "utf-8"),
  ) as ChatLibrary;
  return generateSystemPrompt({ library, promptOptions });
}
