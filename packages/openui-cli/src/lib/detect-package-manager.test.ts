import { describe, expect, it } from "vitest";

import { normalizePackageManagerVersion } from "./detect-package-manager";

describe("normalizePackageManagerVersion", () => {
  it.each(["10.33.0", "v1.22.22", "1.2.3-beta.1+build.4"])(
    "accepts a short semver-like version: %s",
    (version) => {
      expect(normalizePackageManagerVersion(` ${version}\n`)).toBe(version);
    },
  );

  it.each(["private registry output", "1.2.3 secret", `1.2.3-${"1".repeat(65)}`])(
    "drops unexpected or oversized output",
    (version) => {
      expect(normalizePackageManagerVersion(version)).toBeUndefined();
    },
  );
});
