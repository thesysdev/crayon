import { CliCancelledError, CreateError } from "./telemetry";

type InputPromptConfig = {
  type: "input";
  message: string;
  default?: string;
};

type SelectPromptConfig = {
  type: "select";
  message: string;
  choices: Array<{ value: string; name?: string }>;
};

type PromptConfig = InputPromptConfig | SelectPromptConfig;

export type ArgDef<T> = { value: T } | { prompt: PromptConfig; required: true };

type ResolvedArgs<T extends Record<string, ArgDef<unknown>>> = {
  [K in keyof T]: T[K] extends { value: infer V } ? V : string;
};

export function rejectConflictingImmediateFlags(args: string[]): void {
  const separatorIndex = args.indexOf("--");
  const optionArgs = separatorIndex === -1 ? args : args.slice(0, separatorIndex);
  const hasImmediate = optionArgs.some((arg) => arg === "--immediate" || arg === "-i");
  const hasNoImmediate = optionArgs.includes("--no-immediate");
  if (hasImmediate && hasNoImmediate) {
    throw new CreateError("bad_args", "--immediate and --no-immediate cannot be used together.");
  }
}

async function resolveOne(prompt: PromptConfig): Promise<string> {
  if (prompt.type === "select") {
    return promptSelect(prompt.message, prompt.choices);
  }
  const { input } = await import("@inquirer/prompts");
  return input({ message: prompt.message, default: prompt.default });
}

export async function promptSelect(
  message: string,
  choices: readonly unknown[],
  pageSize = choices.length,
): Promise<string> {
  const { select } = await import("@inquirer/prompts");
  try {
    return await select<string>({
      message,
      choices: choices as never,
      pageSize,
    });
  } catch (err) {
    const { ExitPromptError } = await import("@inquirer/core");
    if (err instanceof ExitPromptError) {
      throw new CliCancelledError("args_resolution");
    }
    throw err;
  }
}

export async function resolveArgs<T extends Record<string, ArgDef<unknown>>>(
  defs: T,
  interactive: boolean,
): Promise<ResolvedArgs<T>> {
  const result: Record<string, unknown> = {};

  for (const [key, def] of Object.entries(defs)) {
    if ("value" in def) {
      result[key] = def.value;
      continue;
    }

    if (!interactive) {
      throw new CreateError(
        "args_resolution",
        `Missing required argument --${key}`,
        "invalid_input",
        "MISSING_REQUIRED_ARG",
      );
    }

    try {
      result[key] = await resolveOne(def.prompt);
    } catch (err) {
      const { ExitPromptError } = await import("@inquirer/core");
      if (err instanceof ExitPromptError) {
        throw new CliCancelledError("args_resolution");
      }
      throw err;
    }
  }

  return result as ResolvedArgs<T>;
}
