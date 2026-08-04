const assert = require("node:assert/strict");
const test = require("node:test");

const {
  captureCreateStageSkipped,
  instrumentCreateStage,
} = require("../dist/lib/create-telemetry.js");
const { CliCancelledError, CreateError } = require("../dist/lib/telemetry.js");

function recorder() {
  const events = [];
  return {
    events,
    telemetry: {
      capture(event, properties) {
        events.push({ event, properties });
      },
    },
  };
}

test("records a benchmarkable stage lifecycle", async () => {
  const { events, telemetry } = recorder();
  const clock = [100, 145];

  const result = await instrumentCreateStage("scaffold", () => "ok", {
    telemetry,
    now: () => clock.shift(),
    properties: { template: "openui-cloud" },
  });

  assert.equal(result, "ok");
  assert.equal(events.length, 2);
  assert.equal(events[0].event, "cli_create_stage");
  assert.equal(events[0].properties.stage_status, "started");
  assert.equal(events[1].properties.stage_status, "succeeded");
  assert.equal(events[1].properties.stage_rank, 300);
  assert.equal(events[1].properties.duration_ms, 45);
  assert.equal(events[1].properties.stage_schema_version, 1);
});

test("records a structured stage failure without raw error text", async () => {
  const { events, telemetry } = recorder();
  const privateText = "/Users/person/project api-key=secret";

  await assert.rejects(
    instrumentCreateStage(
      "preflight",
      () => {
        throw new CreateError("preflight", `Target exists: ${privateText}`, {
          telemetryProperties: {
            failure_category: "filesystem",
            failure_code: "TARGET_EXISTS",
          },
        });
      },
      { telemetry },
    ),
  );

  const failed = events[1].properties;
  assert.equal(failed.stage_status, "failed");
  assert.equal(failed.failure_stage, "preflight");
  assert.equal(failed.failure_category, "filesystem");
  assert.equal(failed.failure_code, "TARGET_EXISTS");
  assert.equal(JSON.stringify(failed).includes(privateText), false);
  assert.equal(JSON.stringify(failed).includes("secret"), false);
});

test("keeps cancellation and skips separate from failures", async () => {
  const { events, telemetry } = recorder();

  await assert.rejects(
    instrumentCreateStage(
      "skill_prompt",
      () => {
        throw new CliCancelledError("skill_prompt", 0);
      },
      { telemetry },
    ),
  );
  captureCreateStageSkipped("dependency_install", "no_install_flag", {}, telemetry);

  assert.equal(events[1].properties.stage_status, "cancelled");
  assert.equal(events[1].properties.failure_category, "user_cancelled");
  assert.equal(events[2].properties.stage_status, "skipped");
  assert.equal(events[2].properties.skip_reason, "no_install_flag");
  assert.equal(events[2].properties.duration_ms, 0);
});
