const assert = require("node:assert/strict");
const test = require("node:test");

const { normalizeCliError } = require("../dist/lib/error-reporting.js");

test("classifies peer dependency errors without returning raw stderr", () => {
  const error = new Error("dependency install failed", {
    cause: Object.assign(new Error("pnpm exited"), {
      exitCode: 1,
      stderr: "private/path ERR_PNPM_PEER_DEP_ISSUES secret-value",
    }),
  });

  const result = normalizeCliError(error);

  assert.deepEqual(result, {
    failure_code: "ERR_PNPM_PEER_DEP_ISSUES",
    failure_category: "peer_dependency",
    exit_code: 1,
  });
  assert.equal(JSON.stringify(result).includes("private/path"), false);
  assert.equal(JSON.stringify(result).includes("secret-value"), false);
});

test("classifies common registry and machine failures", () => {
  const cases = [
    ["request failed ENOTFOUND registry.example", "registry_dns"],
    ["request failed ETIMEDOUT", "network_timeout"],
    ["npm ERR! code E401", "registry_auth"],
    ["npm ERR! code ENOSPC", "disk_space"],
    ["npm ERR! code EBADENGINE", "engine_mismatch"],
    ["spawn pnpm ENOENT", "command_missing"],
  ];

  for (const [message, expectedCategory] of cases) {
    assert.equal(normalizeCliError(new Error(message)).failure_category, expectedCategory);
  }
});

test("reports HTTP status without returning a response body", () => {
  const result = normalizeCliError(new Error("Failed (HTTP 503): private response body"));

  assert.deepEqual(result, {
    failure_code: "HTTP_503",
    failure_category: "http_error",
    http_status: 503,
  });
  assert.equal(JSON.stringify(result).includes("private response body"), false);
});
