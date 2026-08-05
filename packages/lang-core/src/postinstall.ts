import { runInstallTelemetry } from "./telemetry/install";

void runInstallTelemetry().catch(() => {
  // The lifecycle entry must always resolve successfully.
});
