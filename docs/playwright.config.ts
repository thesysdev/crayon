import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "list",
  // Use one reviewed baseline across developer machines and Linux CI. The
  // bundled Chromium build and web fonts keep rendering deterministic.
  snapshotPathTemplate: "{testDir}/{testFilePath}-snapshots/{arg}{ext}",
  expect: {
    toHaveScreenshot: {
      animations: "disabled",
      caret: "hide",
      maxDiffPixelRatio: 0.005,
    },
  },
  use: {
    baseURL: "http://127.0.0.1:3100",
    colorScheme: "light",
    locale: "en-US",
    trace: "retain-on-failure",
    viewport: { width: 1280, height: 720 },
  },
  webServer: {
    command: "pnpm exec next dev --hostname 127.0.0.1 --port 3100",
    url: "http://127.0.0.1:3100/demos",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
