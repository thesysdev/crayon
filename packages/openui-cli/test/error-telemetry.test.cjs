const assert = require("node:assert/strict");
const test = require("node:test");

const {
  classifyProcessFailure,
  classifyUnknownFailure,
} = require("../dist/lib/error-telemetry.js");

test("classifies common package-manager and machine failures", () => {
  const cases = [
    ["ERR_PNPM_PEER_DEP_ISSUES", "peer_dependency", "ERR_PNPM_PEER_DEP_ISSUES"],
    ["npm ERR! code E401", "registry_auth", "REGISTRY_401"],
    ["request ENOTFOUND registry.example", "dns", "ENOTFOUND"],
    ["request EAI_AGAIN registry.example", "dns", "EAI_AGAIN"],
    ["request ETIMEDOUT", "network_timeout", "ETIMEDOUT"],
    ["npm ERR! code ENOSPC", "disk_space", "DISK_FULL"],
    ["npm ERR! code EBADENGINE", "engine_mismatch", "ENGINE_MISMATCH"],
    ["npm ERR! code EACCES", "permission", "PERMISSION_DENIED"],
  ];

  for (const [message, category, code] of cases) {
    const result = classifyUnknownFailure(new Error(message));
    assert.equal(result.failure_category, category);
    assert.equal(result.failure_code, code);
  }
});

test("classifies process metadata and cancellation", () => {
  assert.deepEqual(
    classifyProcessFailure({
      succeeded: false,
      exitCode: null,
      signal: null,
      spawnErrorCode: "ENOENT",
      diagnosticOutput: "",
      durationMs: 1,
    }),
    { failure_category: "command_missing", failure_code: "COMMAND_NOT_FOUND" },
  );

  assert.deepEqual(
    classifyProcessFailure({
      succeeded: false,
      exitCode: 130,
      signal: "SIGINT",
      diagnosticOutput: "",
      durationMs: 1,
    }),
    {
      failure_category: "user_cancelled",
      failure_code: "INTERRUPTED",
      exit_code: 130,
      failure_signal: "SIGINT",
      cancellation_exit_code: 130,
    },
  );
});

test("returns only allowlisted HTTP telemetry", () => {
  const privateText = "/Users/person/private?token=secret response-body";
  const result = classifyUnknownFailure(new Error(`Request failed (HTTP 503): ${privateText}`));

  assert.deepEqual(result, {
    failure_category: "http_error",
    failure_code: "HTTP_503",
    http_status: 503,
  });
  assert.equal(JSON.stringify(result).includes(privateText), false);
  assert.equal(JSON.stringify(result).includes("secret"), false);
});

test("does not return raw stderr or nested error text", () => {
  const error = Object.assign(new Error("dependency install failed"), {
    cause: Object.assign(new Error("pnpm failed"), {
      status: 1,
      stderr: "/private/project ERR_PNPM_PEER_DEP_ISSUES npm_credential=secret",
    }),
  });

  const result = classifyUnknownFailure(error);
  assert.equal(result.failure_category, "peer_dependency");
  assert.equal(result.failure_code, "ERR_PNPM_PEER_DEP_ISSUES");
  assert.equal(result.exit_code, 1);
  assert.equal(JSON.stringify(result).includes("/private/project"), false);
  assert.equal(JSON.stringify(result).includes("secret"), false);
});
