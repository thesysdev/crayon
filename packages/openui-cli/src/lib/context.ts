import { telemetry, type Telemetry } from "./telemetry";

export type CliContext = {
  cwd: string;
  argv: string[];
  telemetry: Telemetry;
  verbose: boolean;
  agent?: string;
  /** Whether this run may prompt: a terminal, no `--no-interactive`, and no agent. */
  interactive: boolean;
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
  interactive: false,
  cliVersion: undefined,
};
