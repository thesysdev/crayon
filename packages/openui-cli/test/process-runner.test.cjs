const assert = require("node:assert/strict");
const test = require("node:test");

const { classifyProcessFailure } = require("../dist/lib/error-telemetry.js");
const { runCommand } = require("../dist/lib/process-runner.js");

test("captures generated stdout without inspecting it as diagnostics", async () => {
  const privateOutput = "generated prompt with /private/path and secret";
  const result = await runCommand(
    process.execPath,
    ["-e", `process.stdout.write(${JSON.stringify(privateOutput)})`],
    process.cwd(),
    { stdoutMode: "capture", inspectStdout: false },
  );

  assert.equal(result.succeeded, true);
  assert.equal(result.stdout, privateOutput);
  assert.equal(result.diagnosticOutput, "");
});

test("streams or captures diagnostics and records bounded fingerprints", async () => {
  const result = await runCommand(
    process.execPath,
    ["-e", "process.stdout.write('private-path ERR_PNPM_PEER_DEP_ISSUES'); process.exit(1)"],
    process.cwd(),
    { stdoutMode: "capture", inspectStdout: true },
  );

  assert.equal(result.succeeded, false);
  assert.equal(result.exitCode, 1);
  assert.deepEqual(classifyProcessFailure(result), {
    failure_category: "peer_dependency",
    failure_code: "ERR_PNPM_PEER_DEP_ISSUES",
    exit_code: 1,
  });
});

test("classifies a missing executable without rejecting", async () => {
  const result = await runCommand("definitely-not-an-openui-command", [], process.cwd(), {
    stdoutMode: "capture",
  });

  assert.equal(result.succeeded, false);
  assert.equal(classifyProcessFailure(result).failure_category, "command_missing");
});
