import { generateSystemPrompt, type ChatLibrary } from "@openuidev/lang-core";
import { readFileSync } from "fs";
import { join } from "path";

/** Load the generated library spec and wrap it in Cloud's managed prompt block. */
export function cloudInstructions(extra?: string): string {
  const library = JSON.parse(
    readFileSync(join(process.cwd(), "src/generated/spec.json"), "utf-8"),
  ) as ChatLibrary;
  return generateSystemPrompt({
    cloud: true,
    library,
    ...(extra ? { instructions: extra } : {}),
  });
}
