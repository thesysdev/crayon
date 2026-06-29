import { CloudAuthMethod } from "../auth/mint";
import { TemplateName } from "../commands/create-app";
import { CreateError, Telemetry } from "./telemetry";

export function handleCliError(e: unknown, event: string, telemetry?: Telemetry): void {
  const known = e instanceof CreateError;
  const message = e instanceof Error ? e.message : String(e);
  console.error(known ? `Error: ${message}` : message);

  if (telemetry) {
    telemetry.capture(event, { stage: known ? e.stage : "unknown", error: message.slice(0, 200) });
  }

  process.exitCode = 1;
}

export function normalizeTemplate(t?: string): TemplateName | undefined {
  if (!t) return undefined;
  const v = t.toLowerCase();
  if (v === "chat" || v === "openui-chat") return "openui-chat";
  if (v === "cloud" || v === "openui-cloud") return "openui-cloud";
  throw new CreateError("bad_args", `unknown template "${t}". Use: openui-chat | openui-cloud.`);
}

export function normalizeAuth(a?: string): CloudAuthMethod | undefined {
  if (!a) return undefined;
  const v = a.toLowerCase();
  if (v === "oauth" || v === "manual" || v === "skip") return v;
  throw new CreateError("bad_args", `unknown --auth "${a}". Use: oauth | manual | skip.`);
}
