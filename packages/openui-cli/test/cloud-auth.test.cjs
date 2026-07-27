const assert = require("node:assert/strict");
const { describe, it } = require("node:test");

const { CLOUD_AUTH_CHOICES } = require("../dist/auth/mint.js");
const { normalizeAuth } = require("../dist/lib/utils.js");

describe("OpenUI Cloud auth methods", () => {
  it("does not offer manual API key entry in the interactive flow", () => {
    assert.deepEqual(
      CLOUD_AUTH_CHOICES.map(({ value }) => value),
      ["oauth", "skip"],
    );
  });

  it("keeps the deprecated manual method backward compatible", () => {
    assert.equal(normalizeAuth("manual"), "manual");
  });
});
