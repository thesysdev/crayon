const assert = require("node:assert/strict");
const test = require("node:test");

const { CreateError } = require("../dist/lib/telemetry.js");
const { cliErrorProperties, handleCliError } = require("../dist/lib/utils.js");

test("returns bounded stage, class, and code values", () => {
  assert.deepEqual(
    cliErrorProperties(
      new CreateError(
        "dependency_install",
        "/private/project npm_credential=secret",
        "dependency",
        "NONZERO_EXIT",
      ),
    ),
    {
      failure_stage: "dependency_install",
      error_class: "dependency",
      error_code: "NONZERO_EXIT",
    },
  );

  assert.deepEqual(
    cliErrorProperties(Object.assign(new Error("private path"), { code: "ENOSPC" }), {
      failure_stage: "output_write",
      error_class: "filesystem",
      error_code: "WRITE_FAILED",
    }),
    {
      failure_stage: "output_write",
      error_class: "filesystem",
      error_code: "DISK_FULL",
    },
  );
});

test("failure events never include raw error messages", () => {
  const events = [];
  const telemetry = { capture: (event, properties) => events.push({ event, properties }) };
  const originalConsoleError = console.error;
  const originalExitCode = process.exitCode;
  console.error = () => {};

  try {
    handleCliError(
      new CreateError(
        "worker_execution",
        "/private/project?token=secret",
        "generation",
        "WORKER_FAILED",
      ),
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
      failure_stage: "worker_execution",
      error_class: "generation",
      error_code: "WORKER_FAILED",
    },
  });
  assert.equal(JSON.stringify(events).includes("private/project"), false);
  assert.equal(JSON.stringify(events).includes("secret"), false);
});
