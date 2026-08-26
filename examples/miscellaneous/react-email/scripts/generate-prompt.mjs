import { emailLibrary, emailPromptOptions } from "@openuidev/react-email";
import { mkdirSync, writeFileSync } from "node:fs";

mkdirSync("src/generated", { recursive: true });
writeFileSync("src/generated/system-prompt.txt", emailLibrary.prompt(emailPromptOptions));
console.log("Prompt generated");
