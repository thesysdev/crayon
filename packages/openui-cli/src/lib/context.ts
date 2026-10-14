import { detectAgent, UNKNOWN_AGENT_NAME } from "./detect-agent";
import { telemetry, type Telemetry } from "./telemetry";

export type CliContext = {
  cwd: string;
  argv: string[];
  telemetry: Telemetry;
  verbose: boolean;
  cliVersion?: string;
  /** `--agent-name` as passed. */
  readonly agent?: string;
  /** Agent found from the env markers its harness sets. */
  readonly detectedAgentName?: string;
  /** `--no-interactive` as passed (false when given); undefined for commands without the flag. */
  readonly interactive?: boolean;
  /** Both stdin and stdout are terminals. */
  readonly detectedInteractive: boolean;
  /** The agent driving this run, declared or detected; undefined for a human. */
  readonly activeAgent?: string;
  /** Whether this run may prompt: not `--no-interactive`, a terminal, and no agent. */
  readonly canPrompt: boolean;
  /** Set the passed and detected run values once, before the command runs. */
  initialize(
    this: CliContext,
    passed: { verbose: boolean; agent?: string; interactive?: boolean },
  ): void;
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
  initialize(passed) {
    const detected = detectAgent();
    const agent = passed.agent === UNKNOWN_AGENT_NAME ? undefined : passed.agent;
    const detectedAgentName = detected === UNKNOWN_AGENT_NAME ? undefined : detected;
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
