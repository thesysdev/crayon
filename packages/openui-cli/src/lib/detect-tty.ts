/** True when a human could answer a prompt: both stdin and stdout are terminals. */
export const isInteractiveTerminal = () => Boolean(process.stdin.isTTY && process.stdout.isTTY);
