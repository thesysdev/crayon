import posthog from "posthog-js";

export const CREATE_CLI_COMMAND_COPIED_EVENT = "create_cli_command_copied";

export type CreateCliPackageManager = "pnpm" | "bun" | "yarn" | "npm" | "unknown";

export interface CreateCliCopyAnalyticsContext {
  source: string;
  interaction?: string;
}

interface CreateCliCommandCopiedProperties {
  package_manager: CreateCliPackageManager;
  source: string;
  interaction?: string;
}

const CREATE_CLI_COMMAND_PATTERN = /@openuidev\/cli(?:@\S+)?\s+create(?:\s|$)/i;

export function getCreateCliPackageManager(command: string): CreateCliPackageManager | null {
  const normalized = command.trim().replace(/\s+/g, " ");
  if (!CREATE_CLI_COMMAND_PATTERN.test(normalized)) return null;

  if (/^pnpx\s/i.test(normalized)) return "pnpm";
  if (/^bunx\s/i.test(normalized)) return "bun";
  if (/^yarn dlx\s/i.test(normalized)) return "yarn";
  if (/^npx\s/i.test(normalized)) return "npm";
  return "unknown";
}

export function getCreateCliCommandCopiedProperties(
  command: string,
  context: CreateCliCopyAnalyticsContext,
): CreateCliCommandCopiedProperties | null {
  const packageManager = getCreateCliPackageManager(command);
  if (!packageManager) return null;

  return {
    package_manager: packageManager,
    source: context.source,
    ...(context.interaction ? { interaction: context.interaction } : {}),
  };
}

export function captureCreateCliCommandCopied(
  command: string,
  context: CreateCliCopyAnalyticsContext,
): void {
  const properties = getCreateCliCommandCopiedProperties(command, context);
  if (!properties || typeof window === "undefined") return;

  try {
    posthog.capture(CREATE_CLI_COMMAND_COPIED_EVENT, properties);
  } catch {
    // Analytics must never interfere with a successful clipboard action.
  }
}
