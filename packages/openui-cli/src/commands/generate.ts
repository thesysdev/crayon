import { execFileSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

import { CreateError, telemetry } from "../lib/telemetry";

export interface GenerateOptions {
  out?: string;
  jsonSchema?: boolean;
  export?: string;
  promptOptions?: string;
}

export async function runGenerate(entry: string, options: GenerateOptions): Promise<void> {
  const t0 = Date.now();
  telemetry.capture("cli_generate_started", {
    json_schema: !!options.jsonSchema,
    out_to_file: !!options.out,
  });
  const entryPath = path.resolve(process.cwd(), entry);

  if (!fs.existsSync(entryPath)) {
    throw new CreateError("generate_entry_missing", `File not found: ${entryPath}`);
  }

  const workerPath = path.join(__dirname, "generate-worker.js");

  const workerArgs = [workerPath, entryPath];
  if (options.export) workerArgs.push(options.export);
  if (options.jsonSchema) workerArgs.push("--json-schema");
  if (options.promptOptions) workerArgs.push("--prompt-options", options.promptOptions);

  let output: string;
  try {
    output = execFileSync(process.execPath, workerArgs, {
      encoding: "utf-8",
      cwd: process.cwd(),
      stdio: ["inherit", "pipe", "inherit"],
    });
  } catch (err) {
    throw new CreateError("generate_worker", err instanceof Error ? err.message : String(err));
  }

  if (options.out) {
    const outPath = path.resolve(process.cwd(), options.out);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, output + "\n");
    console.info(`Written to ${outPath}`);
  } else {
    process.stdout.write(output + "\n");
  }

  telemetry.capture("cli_generate_succeeded", {
    json_schema: !!options.jsonSchema,
    out_to_file: !!options.out,
    duration_ms: Date.now() - t0,
  });
}
