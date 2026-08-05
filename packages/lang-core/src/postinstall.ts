import { runInstallTelemetry } from "./install-telemetry";

void runInstallTelemetry().catch(() => {
  // The lifecycle entry must always resolve successfully.
});
