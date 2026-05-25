export const DEMO_CREDITS_EXHAUSTED_CODE = "demo_credits_exhausted";

export const DEMO_CREDITS_EXHAUSTED_MESSAGE =
  "We're recharging the hosted demo credits. Until then, please download the repo and run it locally to see the live demo.";

export const DEMO_CREDITS_LOCAL_COMMANDS = [
  "git clone https://github.com/thesysdev/openui.git",
  "cd openui",
  "pnpm install",
  'echo "OPENAI_API_KEY=sk-your-key-here" > examples/openui-chat/.env.local',
  "pnpm --filter openui-chat dev",
] as const;

export type DemoCreditsErrorPayload = {
  code: typeof DEMO_CREDITS_EXHAUSTED_CODE;
  message: string;
  instructions: readonly string[];
};

export function createDemoCreditsErrorPayload(): DemoCreditsErrorPayload {
  return {
    code: DEMO_CREDITS_EXHAUSTED_CODE,
    message: DEMO_CREDITS_EXHAUSTED_MESSAGE,
    instructions: DEMO_CREDITS_LOCAL_COMMANDS,
  };
}

export function isDemoCreditsErrorPayload(value: unknown): value is DemoCreditsErrorPayload {
  return (
    typeof value === "object" &&
    value !== null &&
    "code" in value &&
    (value as { code?: unknown }).code === DEMO_CREDITS_EXHAUSTED_CODE
  );
}

function errorText(value: unknown): string {
  if (value instanceof Error) {
    return `${value.name} ${value.message}`.toLowerCase();
  }
  if (typeof value === "string") return value.toLowerCase();
  try {
    return JSON.stringify(value).toLowerCase();
  } catch {
    return "";
  }
}

function hasPaymentRequiredCode(value: unknown, depth = 0): boolean {
  if (depth > 4 || typeof value !== "object" || value === null) return false;

  for (const [key, child] of Object.entries(value)) {
    if (
      ["code", "status", "statusCode"].includes(key) &&
      (child === 402 || child === "402")
    ) {
      return true;
    }

    if (hasPaymentRequiredCode(child, depth + 1)) {
      return true;
    }
  }

  return false;
}

function hasSignal(text: string, signal: string): boolean {
  return new RegExp(`(^|[^a-z0-9_])${signal.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z0-9_]|$)`).test(
    text,
  );
}

export function isDemoCreditsExhaustedError(error: unknown, status?: number): boolean {
  if (status === 402) return true;
  if (hasPaymentRequiredCode(error)) return true;

  const text = errorText(error);
  if (!text) return false;

  return [
    DEMO_CREDITS_EXHAUSTED_CODE,
    "insufficient_quota",
    "insufficient credits",
    "insufficient quota",
    "insufficient balance",
    "requires more credits",
    "can only afford",
    "payment required",
    "out of credits",
  ].some((signal) => hasSignal(text, signal));
}

export function createDemoCreditsExhaustedResponse(): Response {
  return Response.json({ error: createDemoCreditsErrorPayload() }, { status: 402 });
}
