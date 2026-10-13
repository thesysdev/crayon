export const isInteractiveTerminal = () => Boolean(process.stdin.isTTY && process.stdout.isTTY);

/** True when someone can answer a prompt: a terminal, no `--no-interactive`, and no agent. */
export function canPromptInteractive(noInteractive = false, agent?: string): boolean {
  return isInteractiveTerminal() && !noInteractive && !agent;
}
