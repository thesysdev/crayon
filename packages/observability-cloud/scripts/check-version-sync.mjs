#!/usr/bin/env node
/**
 * Fails the build when `SDK_VERSION` in src/core/wire.ts has drifted from the
 * version in package.json.
 *
 * Why this exists: `SDK_VERSION` is what every envelope reports as
 * `sdk.version`, and it is maintained by hand. It was missed on the 0.0.2
 * release, so every 0.0.2 client identified itself as 0.0.1 on the wire and
 * ingest could not tell the two releases apart.
 *
 * There is already a unit test asserting this (src/core/wire.test.ts), but a
 * release can be cut without the tests passing — that is exactly how 0.0.2
 * shipped. This runs as part of `build`, which `prepare` invokes, so it also
 * guards `npm publish`.
 *
 * Deliberately wired into the `build` script rather than named `prebuild`:
 * pnpm ships with `enable-pre-post-scripts=false` by default, so a `prebuild`
 * script would silently never run.
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const packageJsonPath = join(packageRoot, "package.json");
const wirePath = join(packageRoot, "src/core/wire.ts");

function fail(message) {
  console.error(`\n  version-sync check failed\n\n  ${message}\n`);
  process.exit(1);
}

const { version: packageVersion } = JSON.parse(readFileSync(packageJsonPath, "utf8"));
if (typeof packageVersion !== "string") {
  fail(`Could not read a "version" string from ${packageJsonPath}`);
}

const wireSource = readFileSync(wirePath, "utf8");
const match = wireSource.match(/export const SDK_VERSION\s*=\s*["']([^"']+)["']/);
if (!match) {
  fail(
    `Could not find an \`export const SDK_VERSION = "…"\` declaration in ${wirePath}.\n` +
      `  If it was renamed or is now derived at build time, update this script to match.`,
  );
}

const sdkVersion = match[1];
if (sdkVersion !== packageVersion) {
  fail(
    `SDK_VERSION is "${sdkVersion}" but package.json is "${packageVersion}".\n\n` +
      `  SDK_VERSION is reported on every envelope as sdk.version, so a mismatch\n` +
      `  makes ingest unable to tell releases apart.\n\n` +
      `  Fix: set SDK_VERSION to "${packageVersion}" in src/core/wire.ts`,
  );
}

console.log(`version-sync ok: SDK_VERSION and package.json are both ${packageVersion}`);
