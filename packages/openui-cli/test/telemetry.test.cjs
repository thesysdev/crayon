const assert = require("node:assert/strict");
const test = require("node:test");

const { Telemetry } = require("../dist/lib/telemetry.js");

test("registered run context is attached to every captured event", () => {
  const payloads = [];
  const telemetry = new Telemetry();
  telemetry.enabled = true;
  telemetry.distinctId = "test-person";
  telemetry.client = { capture: (payload) => payloads.push(payload) };
  telemetry.register({ cli_run_id: "run-123", command: "create" });

  telemetry.capture("cli_create_stage", { stage: "preflight" });

  assert.deepEqual(payloads[0], {
    distinctId: "test-person",
    event: "cli_create_stage",
    properties: {
      cli_run_id: "run-123",
      command: "create",
      stage: "preflight",
    },
  });
});
