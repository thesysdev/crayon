import { telemetry, type Telemetry } from "./telemetry";

export type CliContext = {
  cwd: string;
  argv: string[];
  telemetry: Telemetry;
  verbose: boolean;
  /** `--agent-name` as passed. */
  agent?: string;
  /** Agent found from the env markers its harness sets. */
  detectedAgent?: string;
  /** `--no-interactive` as passed (false when given); undefined for commands without the flag. */
  interactive?: boolean;
  /** Both stdin and stdout are terminals. */
  detectedInteractive: boolean;
  cliVersion?: string;
};

export const context: CliContext = {
  get cwd() {
    return process.cwd();
  },
  get argv() {
    return process.argv;
  },
  telemetry,
  verbose: false,
  detectedInteractive: false,
  cliVersion: undefined,
};

/** The agent driving this run, declared or detected; undefined for a human. */
export function activeAgent(ctx: CliContext): string | undefined {
  return ctx.agent ?? ctx.detectedAgent;
}

/** Whether this run may prompt: not `--no-interactive`, a terminal, and no agent. */
export function canPrompt(ctx: CliContext): boolean {
  return ctx.interactive !== false && ctx.detectedInteractive && !activeAgent(ctx);
}
