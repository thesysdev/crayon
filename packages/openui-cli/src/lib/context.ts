import { detectAgent, UNKNOWN_AGENT_NAME } from "./detect-agent";
import { telemetry, type Telemetry } from "./telemetry";

export type CliContext = {
  cwd: string;
  argv: string[];
  telemetry: Telemetry;
  verbose: boolean;
  cliVersion?: string;
  readonly agent?: string;
  readonly detectedAgentName?: string;
  /** `--no-interactive` as passed (false when given); undefined for commands without the flag. */
  readonly interactive?: boolean;
  readonly detectedInteractive: boolean;
  readonly activeAgent?: string;
  readonly canPrompt: boolean;
  initialize(
    this: CliContext,
    passed: { verbose: boolean; agent?: string; interactive?: boolean },
  ): Promise<void>;
};

const isInteractiveTerminal = () => Boolean(process.stdin.isTTY && process.stdout.isTTY);

export const context: CliContext = {
  get cwd() {
    return process.cwd();
  },
  get argv() {
    return process.argv;
  },
  telemetry,
  verbose: false,
  cliVersion: undefined,
  detectedInteractive: false,
  canPrompt: false,
  async initialize(passed) {
    const agent = passed.agent === UNKNOWN_AGENT_NAME ? undefined : passed.agent;
    const detectedAgentName = await detectAgent();
    const detectedInteractive = isInteractiveTerminal();
    const activeAgent = agent ?? detectedAgentName;
    const verbose = passed.verbose;
    Object.assign(this, {
      agent,
      verbose,
      detectedAgentName,
      interactive: passed.interactive,
      detectedInteractive,
      activeAgent,
      canPrompt: passed.interactive !== false && detectedInteractive && !activeAgent,
    } satisfies Partial<CliContext>);
  },
};
