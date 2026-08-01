"use strict";

try {
  process.env.OPENUI_DEVTOOLS_PACKAGE_VERSION = require("./package.json").version;
  require("./dist/postinstall.cjs");
} catch {
  // Telemetry must never fail installation, including a clean source checkout
  // where the compiled postinstall entry does not exist yet.
}
