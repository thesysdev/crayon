import * as fs from "fs";
import * as path from "path";
import { runCommand } from "../lib/process-runner";
import {
  cliErrorProperties,
  createCliError,
  processErrorProperties,
  SEPARATION_DELIMITER,
} from "../lib/utils";

import { CliCancelledError, CreateError, telemetry } from "../lib/telemetry";

export interface GenerateOptions {
  out?: string;
  jsonSchema?: boolean;
  spec?: boolean;
  export?: string;
  promptOptions?: string;
  interactive: boolean;
}

export async function runGenerate(
  entry: string,
  options: Omit<GenerateOptions, "interactive">,
): Promise<void> {
  const t0 = Date.now();
  telemetry.capture("cli_generate_started", {
    json_schema: !!options.jsonSchema,
    spec: !!options.spec,
    out_to_file: !!options.out,
  });
  const entryPath = path.resolve(process.cwd(), entry);

  if (!fs.existsSync(entryPath)) {
    throw new CreateError(
      "entry_validation",
      `File not found: ${entryPath}`,
      "invalid_input",
      "ENTRY_NOT_FOUND",
    );
  }

  const workerPath = path.join(__dirname, "generate-worker.js");

  const workerArgs = [workerPath, entryPath];
  if (options.export) workerArgs.push(options.export);
  if (options.jsonSchema) workerArgs.push("--json-schema");
  if (options.spec) workerArgs.push("--spec");
  if (options.promptOptions) workerArgs.push("--prompt-options", options.promptOptions);

  const workerResult = await runCommand(process.execPath, workerArgs, process.cwd(), {
    captureStdout: true,
  });
  if (workerResult.error || workerResult.status !== 0) {
    const properties = processErrorProperties(workerResult, "worker_execution", {
      error_class: "generation",
      error_code: "WORKER_FAILED",
    });
    if (properties.error_class === "user_cancelled") {
      throw new CliCancelledError(
        "worker_execution",
        properties.cancellation_exit_code ?? 0,
        properties,
      );
    }
    throw createCliError("generation worker failed", properties);
  }
  const output = workerResult.stdout ?? "";

  try {
    if (options.jsonSchema || options.spec) {
      if (options.out) {
        const outPath = path.resolve(process.cwd(), options.out);
        fs.mkdirSync(path.dirname(outPath), { recursive: true });
        fs.writeFileSync(outPath, output + "\n");
        console.info(`Written to ${outPath}`);
      } else {
        stdoutWrite(output);
      }
    } else {
      // Both artifact mode
      // `--out <file>` receives the prompt (legacy behavior preserved);
      // the spec lands alongside it as `<file>.spec.json` (extension swapped).
      // Without `--out` both go to stdout.
      const [prompt = "", specJson = ""] = output.split(SEPARATION_DELIMITER);
      if (options.out) {
        const promptPath = path.resolve(process.cwd(), options.out);
        fs.mkdirSync(path.dirname(promptPath), { recursive: true });
        const base = promptPath.slice(0, promptPath.length - path.extname(promptPath).length);
        const specPath = `${base}.spec.json`;
        fs.writeFileSync(promptPath, prompt + "\n");
        fs.writeFileSync(specPath, specJson + "\n");
        console.info(`Written System Prompt to ${promptPath}`);
        console.info(`Written Library Spec to ${specPath}`);
      } else {
        stdoutWrite(prompt + "\n\n" + specJson);
      }
    }
  } catch (error) {
    const properties = cliErrorProperties(error, {
      failure_stage: "output_write",
      error_class: "filesystem",
      error_code: "WRITE_FAILED",
    });
    throw createCliError(error instanceof Error ? error.message : String(error), properties);
  }

  telemetry.capture("cli_generate_succeeded", {
    json_schema: !!options.jsonSchema,
    spec: !!options.spec,
    out_to_file: !!options.out,
    duration_ms: Date.now() - t0,
  });
}

function stdoutWrite(content: string) {
  process.stdout.write(content + "\n");
}
