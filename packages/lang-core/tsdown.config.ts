import { defineConfig } from "tsdown";
import packageJson from "./package.json" with { type: "json" };

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  target: "es2022",
  outDir: "dist",
  clean: true,
  define: {
    __OPENUI_LANG_CORE_VERSION__: JSON.stringify(packageJson.version),
    __OPENUI_TELEMETRY_CAPTURE_URL__: JSON.stringify("https://us.i.posthog.com/capture/"),
    __OPENUI_TELEMETRY_POSTHOG_KEY__: JSON.stringify(
      "phc_3OLW53x09ZTVZSV6BEpj5uycj3ooqR6KOemOjx04e3D",
    ),
  },
  deps: {
    neverBundle: [/^(?![./]|[A-Za-z]:[/\\])/],
  },
});
