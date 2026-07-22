const assert = require("node:assert/strict");
const test = require("node:test");

const {
  captureCreateStageSkipped,
  instrumentCreateStage,
} = require("../dist/lib/create-telemetry.js");

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

test("records a benchmarkable stage lifecycle and duration", async () => {
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
  assert.equal(events[1].properties.duration_ms, 45);
  assert.equal(events[1].properties.stage_schema_version, 1);
  assert.equal(events[1].properties.stage_rank, 300);
});

test("records normalized failure properties", async () => {
  const { events, telemetry } = recorder();
  const clock = [10, 20];

  await assert.rejects(
    instrumentCreateStage(
      "dependency_install",
      () => {
        throw Object.assign(new Error("ERR_PNPM_PEER_DEP_ISSUES"), { status: 1 });
      },
      { telemetry, now: () => clock.shift() },
    ),
  );

  assert.equal(events[1].properties.stage_status, "failed");
  assert.equal(events[1].properties.failure_category, "peer_dependency");
  assert.equal(events[1].properties.exit_code, 1);
});

test("records intentional skips separately from failures", () => {
  const { events, telemetry } = recorder();

  captureCreateStageSkipped("dependency_install", "no_install_flag", {}, telemetry);

  assert.equal(events[0].properties.stage_status, "skipped");
  assert.equal(events[0].properties.skip_reason, "no_install_flag");
  assert.equal(events[0].properties.duration_ms, 0);
});

test("converts prompt exits into a cancellation outcome", async () => {
  const { events, telemetry } = recorder();
  const promptExit = Object.assign(new Error("prompt exited"), { name: "ExitPromptError" });

  await assert.rejects(
    instrumentCreateStage("skill_prompt", () => Promise.reject(promptExit), { telemetry }),
    { name: "CliCancellation", stage: "skill_prompt" },
  );

  assert.equal(events[1].properties.stage_status, "cancelled");
  assert.equal(events[1].properties.failure_category, "user_cancelled");
});
