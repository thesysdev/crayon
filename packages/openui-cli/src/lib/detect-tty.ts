export const isInteractiveTerminal = () => Boolean(process.stdin.isTTY && process.stdout.isTTY);
