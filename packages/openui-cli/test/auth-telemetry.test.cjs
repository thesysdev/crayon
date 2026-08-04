const assert = require("node:assert/strict");
const test = require("node:test");

const { classifyCloudAuthFailure, CloudAuthError } = require("../dist/auth/mint.js");

test("classifies Cloud auth substages with bounded values", () => {
  const error = new CloudAuthError("organization", "private account response with secret", "oauth");
  const result = classifyCloudAuthFailure(error);

  assert.deepEqual(result, {
    failure_category: "authentication",
    failure_code: "ORG_NOT_FOUND",
    auth_failure_stage: "organization",
    auth_method: "oauth",
  });
  assert.equal(JSON.stringify(result).includes("secret"), false);
});

test("reduces failed key-mint responses to HTTP status", () => {
  const result = classifyCloudAuthFailure(
    new CloudAuthError("key_mint_response", "private response body", "oauth", 503),
  );

  assert.deepEqual(result, {
    failure_category: "http_error",
    failure_code: "HTTP_503",
    http_status: 503,
    auth_failure_stage: "key_mint_response",
    auth_method: "oauth",
  });
  assert.equal(JSON.stringify(result).includes("private response body"), false);
});
