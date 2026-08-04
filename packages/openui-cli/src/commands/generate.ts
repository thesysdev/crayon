import * as fs from "fs";
import * as path from "path";
import { SEPARATION_DELIMITER } from "../lib/utils";

import { classifyProcessFailure, withFailureFallback } from "../lib/error-telemetry";
import { instrumentGenerateStage } from "../lib/generate-telemetry";
import { runCommand } from "../lib/process-runner";
import { resolveArgs } from "../lib/resolve-args";
import { CreateError, telemetry } from "../lib/telemetry";

export interface GenerateOptions {
  out?: string;
  jsonSchema?: boolean;
  spec?: boolean;
  export?: string;
  promptOptions?: string;
  interactive: boolean;
}

export async function runGenerate(
  entry: string | undefined,
  options: GenerateOptions,
): Promise<void> {
  const t0 = Date.now();
  telemetry.capture("cli_generate_started", {
    json_schema: !!options.jsonSchema,
    spec: !!options.spec,
    out_to_file: !!options.out,
  });

  const args = await instrumentGenerateStage(
    "args_resolution",
    () =>
      resolveArgs(
        {
          entry: entry
            ? { value: entry }
            : {
                prompt: { type: "input", message: "Entry file path?" },
                required: true,
              },
        },
        options.interactive,
      ),
    {
      properties: {
        json_schema: !!options.jsonSchema,
        spec: !!options.spec,
        out_to_file: !!options.out,
      },
    },
  );

  const entryPath = await instrumentGenerateStage("entry_validation", () => {
    const resolvedEntryPath = path.resolve(process.cwd(), (args as { entry: string }).entry);
    if (!fs.existsSync(resolvedEntryPath)) {
      throw new CreateError("entry_validation", `File not found: ${resolvedEntryPath}`, {
        telemetryProperties: {
          failure_category: "filesystem",
          failure_code: "ENTRY_NOT_FOUND",
        },
      });
    }
    return resolvedEntryPath;
  });

  const workerPath = path.join(__dirname, "generate-worker.js");

  const workerArgs = [workerPath, entryPath];
  if (options.export) workerArgs.push(options.export);
  if (options.jsonSchema) workerArgs.push("--json-schema");
  if (options.spec) workerArgs.push("--spec");
  if (options.promptOptions) workerArgs.push("--prompt-options", options.promptOptions);

  const workerResult = await instrumentGenerateStage(
    "worker_execution",
    () =>
      runCommand(process.execPath, workerArgs, process.cwd(), {
        stdoutMode: "capture",
        inspectStdout: false,
      }),
    {
      resultStatus: (result) => (result.succeeded ? "succeeded" : "failed"),
      resultProperties: (result) =>
        result.succeeded
          ? {}
          : withFailureFallback(classifyProcessFailure(result), {
              failure_category: "generation",
              failure_code: "WORKER_FAILED",
            }),
    },
  );
  if (!workerResult.succeeded) {
    const failure = withFailureFallback(classifyProcessFailure(workerResult), {
      failure_category: "generation",
      failure_code: "WORKER_FAILED",
    });
    throw new CreateError("worker_execution", "Generation worker failed.", {
      telemetryProperties: failure,
    });
  }
  const output = workerResult.stdout ?? "";

  await instrumentGenerateStage(
    "output_write",
    () => {
      if (options.jsonSchema || options.spec) {
        if (options.out) {
          const outPath = path.resolve(process.cwd(), options.out);
          fs.mkdirSync(path.dirname(outPath), { recursive: true });
          fs.writeFileSync(outPath, output + "\n");
          console.info(`Written to ${outPath}`);
        } else {
          stdoutWrite(output);
        }
        return;
      }

      // Both artifact mode. `--out <file>` receives the prompt and the spec is
      // written alongside it; without `--out`, both go to stdout.
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
    },
    {
      errorProperties: (error) =>
        withFailureFallback(
          classifyProcessFailure({
            succeeded: false,
            exitCode: null,
            signal: null,
            diagnosticOutput: error instanceof Error ? error.message : "",
            durationMs: 0,
          }),
          { failure_category: "filesystem", failure_code: "WRITE_FAILED" },
        ),
    },
  );

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
