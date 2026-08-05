import { createParser } from "@openuidev/lang-core";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { astToA2UIJsonStream, openUIToA2UILangStream } from "./a2ui-converter.js";

export const A2UI_SCENARIOS = [
  "simple-table",
  "chart-with-data",
  "contact-form",
  "dashboard",
  "pricing-page",
  "settings-panel",
  "e-commerce-product",
] as const;

export function generateA2UISamples(): void {
  const schema = JSON.parse(readFileSync(join("schema.json"), "utf-8"));
  const parser = createParser(schema);

  for (const scenario of A2UI_SCENARIOS) {
    const source = readFileSync(join("samples", `${scenario}.oui`), "utf-8");
    const result = parser.parse(source);
    if (!result.root) throw new Error(`OpenUI sample has no root: ${scenario}`);
    if (result.meta.errors.length > 0) {
      throw new Error(
        `OpenUI sample failed to parse: ${scenario}\n${JSON.stringify(result.meta.errors, null, 2)}`,
      );
    }

    writeFileSync(join("samples", `${scenario}.a2ui.jsonl`), astToA2UIJsonStream(result.root));
    writeFileSync(join("samples", `${scenario}.a2ui-openui.jsonl`), openUIToA2UILangStream(source));
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  generateA2UISamples();
  console.log(
    `Generated A2UI JSON and A2UI + OpenUI Lang streams for ${A2UI_SCENARIOS.length} scenarios.`,
  );
}
