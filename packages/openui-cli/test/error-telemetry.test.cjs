const assert = require("node:assert/strict");
const test = require("node:test");

const { CloudAuthError } = require("../dist/auth/mint.js");
const { runCommand } = require("../dist/lib/process-runner.js");
const { CliCancelledError, CreateError, Telemetry } = require("../dist/lib/telemetry.js");
const {
  cliErrorProperties,
  handleCliError,
  processErrorProperties,
} = require("../dist/lib/utils.js");

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

test("registered run context is attached to every event", () => {
  const payloads = [];
  const telemetry = new Telemetry();
  telemetry.enabled = true;
  telemetry.distinctId = "test-person";
  telemetry.client = { capture: (payload) => payloads.push(payload) };
  telemetry.register({ cli_run_id: "run-123", command: "create" });

  telemetry.capture("cli_dependency_install_failed", { error_code: "ERESOLVE" });

  assert.equal(payloads[0].properties.cli_run_id, "run-123");
  assert.equal(payloads[0].properties.command, "create");
});

test("classifies dependency, workspace, and package failures with process metadata", () => {
  const cases = [
    ["ERR_PNPM_PEER_DEP_ISSUES", "peer_dependency", "PEER_DEPENDENCY"],
    ["npm ERR! code E401", "registry_auth", "REGISTRY_401"],
    ["request ENOTFOUND registry.example", "network", "DNS_FAILED"],
    ["ERR_PNPM_OUTDATED_LOCKFILE", "workspace_config", "LOCKFILE_INCOMPATIBLE"],
    ["npm ERR! code EBADENGINE", "package_compatibility", "ENGINE_MISMATCH"],
    ["npm ERR! code ELIFECYCLE", "install_script", "INSTALL_SCRIPT_FAILED"],
  ];

  for (const [diagnosticTail, errorClass, errorCode] of cases) {
    const properties = processErrorProperties(
      { status: 1, signal: null, durationMs: 12, diagnosticTail },
      "dependency_install",
      { error_class: "dependency", error_code: "NONZERO_EXIT" },
    );
    assert.equal(properties.error_class, errorClass);
    assert.equal(properties.error_code, errorCode);
    assert.equal(properties.exit_code, 1);
    assert.equal(properties.duration_ms, 12);
    assert.equal(JSON.stringify(properties).includes(diagnosticTail), false);
  }
});

test("preserves cloud-auth substage and HTTP status without raw messages", () => {
  const properties = cliErrorProperties(
    new CloudAuthError("key_mint_request", "HTTP_503", "/private/token=secret", 503),
  );
  assert.deepEqual(properties, {
    failure_stage: "cloud_auth",
    error_class: "authentication",
    error_code: "HTTP_503",
    auth_failure_stage: "key_mint_request",
    http_status: 503,
  });
  assert.equal(JSON.stringify(properties).includes("secret"), false);
});

test("classifies process cancellation separately", () => {
  assert.deepEqual(
    processErrorProperties(
      { status: 130, signal: "SIGINT", durationMs: 25, diagnosticTail: "private output" },
      "dependency_install",
      { error_class: "dependency", error_code: "NONZERO_EXIT" },
    ),
    {
      failure_stage: "dependency_install",
      error_class: "user_cancelled",
      error_code: "INTERRUPTED",
      duration_ms: 25,
      exit_code: 130,
      failure_signal: "SIGINT",
      cancellation_exit_code: 130,
    },
  );
});

test("process runner retains bounded diagnostics and signal metadata", async () => {
  const failed = await runCommand(
    process.execPath,
    ["-e", "process.stdout.write('ERESOLVE'); process.exit(1)"],
    process.cwd(),
  );
  assert.equal(failed.status, 1);
  assert.match(failed.diagnosticTail, /ERESOLVE/);

  const interrupted = await runCommand(
    process.execPath,
    ["-e", "process.kill(process.pid, 'SIGINT')"],
    process.cwd(),
  );
  assert.equal(interrupted.signal, "SIGINT");

  const captured = await runCommand(
    process.execPath,
    ["-e", "process.stdout.write('/private/generated?token=secret')"],
    process.cwd(),
    { captureStdout: true },
  );
  assert.match(captured.stdout, /private\/generated/);
  assert.equal(captured.diagnosticTail.includes("secret"), false);
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

test("top-level cancellation emits a cancelled event", () => {
  const events = [];
  const telemetry = { capture: (event, properties) => events.push({ event, properties }) };
  const originalExitCode = process.exitCode;

  try {
    handleCliError(new CliCancelledError("args_resolution"), "cli_generate_failed", telemetry);
  } finally {
    process.exitCode = originalExitCode;
  }

  assert.equal(events[0].event, "cli_generate_cancelled");
  assert.equal(events[0].properties.failure_stage, "args_resolution");
  assert.equal(events[0].properties.error_class, "user_cancelled");
  assert.equal(events[0].properties.cancellation_exit_code, 0);
});
