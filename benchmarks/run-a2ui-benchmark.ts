import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { encoding_for_model } from "tiktoken";
import { A2UI_SCENARIOS } from "./generate-a2ui-samples.js";

const TOKENS_PER_SECOND = 60;
const enc = encoding_for_model("gpt-5");

interface ScenarioResult {
  scenario: string;
  a2uiJsonTokens: number;
  a2uiOpenUITokens: number;
  tokensSaved: number;
  reductionPercent: number;
  a2uiJsonLatencySeconds: number;
  a2uiOpenUILatencySeconds: number;
  speedup: number;
}

function countTokens(text: string): number {
  return enc.encode(text).length;
}

function fixed(value: number, precision = 1): number {
  return Number(value.toFixed(precision));
}

function markdown(results: ScenarioResult[]): string {
  const totalJson = results.reduce((total, result) => total + result.a2uiJsonTokens, 0);
  const totalOpenUI = results.reduce((total, result) => total + result.a2uiOpenUITokens, 0);
  const rows = results.map(
    (result) =>
      `| ${result.scenario} | ${result.a2uiJsonTokens} | ${result.a2uiOpenUITokens} | ${result.tokensSaved} | -${result.reductionPercent.toFixed(1)}% | ${result.a2uiJsonLatencySeconds.toFixed(2)}s | ${result.a2uiOpenUILatencySeconds.toFixed(2)}s | ${result.speedup.toFixed(2)}x |`,
  );
  rows.push(
    `| **TOTAL** | **${totalJson}** | **${totalOpenUI}** | **${totalJson - totalOpenUI}** | **-${(((totalJson - totalOpenUI) / totalJson) * 100).toFixed(1)}%** | **${(totalJson / TOKENS_PER_SECOND).toFixed(2)}s** | **${(totalOpenUI / TOKENS_PER_SECOND).toFixed(2)}s** | **${(totalJson / totalOpenUI).toFixed(2)}x** |`,
  );

  return [
    "| Scenario | A2UI + JSON | A2UI + OpenUI Lang | Tokens saved | Reduction | JSON latency | OpenUI latency | Speedup |",
    "|---|---:|---:|---:|---:|---:|---:|---:|",
    ...rows,
  ].join("\n");
}

function main(): void {
  const results: ScenarioResult[] = A2UI_SCENARIOS.map((scenario) => {
    const json = readFileSync(join("samples", `${scenario}.a2ui.jsonl`), "utf-8");
    const openui = readFileSync(join("samples", `${scenario}.a2ui-openui.jsonl`), "utf-8");
    const a2uiJsonTokens = countTokens(json);
    const a2uiOpenUITokens = countTokens(openui);
    return {
      scenario,
      a2uiJsonTokens,
      a2uiOpenUITokens,
      tokensSaved: a2uiJsonTokens - a2uiOpenUITokens,
      reductionPercent: fixed(((a2uiJsonTokens - a2uiOpenUITokens) / a2uiJsonTokens) * 100),
      a2uiJsonLatencySeconds: fixed(a2uiJsonTokens / TOKENS_PER_SECOND, 2),
      a2uiOpenUILatencySeconds: fixed(a2uiOpenUITokens / TOKENS_PER_SECOND, 2),
      speedup: fixed(a2uiJsonTokens / a2uiOpenUITokens, 2),
    };
  });
  const totalJson = results.reduce((total, result) => total + result.a2uiJsonTokens, 0);
  const totalOpenUI = results.reduce((total, result) => total + result.a2uiOpenUITokens, 0);
  const report = {
    tokenizer: "tiktoken:gpt-5",
    estimatedTokensPerSecond: TOKENS_PER_SECOND,
    protocol: "A2UI v1.0",
    measuredArtifact: "createSurface + updateComponents JSONL stream",
    invariant:
      "Same A2UI envelopes and same parsed UI; only updateComponents.components encoding differs.",
    totals: {
      a2uiJsonTokens: totalJson,
      a2uiOpenUITokens: totalOpenUI,
      tokensSaved: totalJson - totalOpenUI,
      reductionPercent: fixed(((totalJson - totalOpenUI) / totalJson) * 100),
      estimatedSpeedup: fixed(totalJson / totalOpenUI, 2),
    },
    scenarios: results,
  };

  writeFileSync(join("a2ui-results.json"), `${JSON.stringify(report, null, 2)}\n`);
  console.log("\n# A2UI JSON vs A2UI + OpenUI Lang\n");
  console.log(markdown(results));
  console.log(
    `\nToken counts use tiktoken's gpt-5 encoding. Latency is estimated at ${TOKENS_PER_SECOND} output tokens/second.`,
  );
  enc.free();
}

main();
