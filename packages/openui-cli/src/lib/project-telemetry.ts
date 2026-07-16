import * as fs from "node:fs";
import * as path from "node:path";

import type { TemplateName } from "./create-types";

export const PROJECT_TELEMETRY_SCHEMA_VERSION = 1;
export const PROJECT_TELEMETRY_RELATIVE_PATH = path.join(".openui", "telemetry.json");

export type ProjectTelemetryState = {
  schemaVersion: typeof PROJECT_TELEMETRY_SCHEMA_VERSION;
  projectId: string;
};

export function createProjectTelemetryState(
  template: TemplateName,
  telemetryEnabled: boolean,
): ProjectTelemetryState | undefined {
  if (!telemetryEnabled || template !== "openui-cloud") return undefined;

  return {
    schemaVersion: PROJECT_TELEMETRY_SCHEMA_VERSION,
    projectId: crypto.randomUUID(),
  };
}

/** Best-effort metadata write: telemetry must never make scaffolding fail. */
export function writeProjectTelemetryState(
  projectDir: string,
  state: ProjectTelemetryState,
): boolean {
  try {
    const file = path.join(projectDir, PROJECT_TELEMETRY_RELATIVE_PATH);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(state, null, 2) + "\n");
    return true;
  } catch {
    return false;
  }
}
