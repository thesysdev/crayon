const assert = require("node:assert/strict");
const test = require("node:test");

const { CreateError } = require("../dist/lib/telemetry.js");
const { handleCliError } = require("../dist/lib/utils.js");

test("top-level create failures preserve stage and safe class", () => {
  const events = [];
  const telemetry = { capture: (event, properties) => events.push({ event, properties }) };
  const originalConsoleError = console.error;
  const originalExitCode = process.exitCode;
  console.error = () => {};

  try {
    handleCliError(
      new CreateError("dependency_install", "private /path secret", {
        telemetryProperties: {
          failure_category: "registry_auth",
          failure_code: "REGISTRY_401",
          exit_code: 1,
        },
      }),
      "cli_create_failed",
      telemetry,
    );
  } finally {
    console.error = originalConsoleError;
    process.exitCode = originalExitCode;
  }

  assert.equal(events[0].event, "cli_create_failed");
  assert.equal(events[0].properties.failure_stage, "dependency_install");
  assert.equal(events[0].properties.failure_category, "registry_auth");
  assert.equal(events[0].properties.failure_code, "REGISTRY_401");
  assert.equal(JSON.stringify(events[0]).includes("private /path"), false);
  assert.equal(JSON.stringify(events[0]).includes("secret"), false);
});

test("generate failures no longer emit raw messages", () => {
  const events = [];
  const telemetry = { capture: (event, properties) => events.push({ event, properties }) };
  const originalConsoleError = console.error;
  const originalExitCode = process.exitCode;
  console.error = () => {};

  try {
    handleCliError(
      new CreateError("entry_validation", "/private/project/missing.ts", {
        telemetryProperties: {
          failure_category: "filesystem",
          failure_code: "ENTRY_NOT_FOUND",
        },
      }),
      "cli_generate_failed",
      telemetry,
    );
  } finally {
    console.error = originalConsoleError;
    process.exitCode = originalExitCode;
  }

  assert.deepEqual(events[0], {
    event: "cli_generate_failed",
    properties: {
      failure_stage: "entry_validation",
      failure_category: "filesystem",
      failure_code: "ENTRY_NOT_FOUND",
    },
  });
});
