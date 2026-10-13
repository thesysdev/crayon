// Lighthouse CI for the docs site. Run from this directory after `pnpm build`:
//
//   LHCI_FORM_FACTOR=mobile npx @lhci/cli@0.15.1 autorun
//
// LHCI_FORM_FACTOR picks the profile (mobile, the default, or desktop). Each run
// starts `next start`, audits the pages below, and writes reports to
// lighthouse-reports/<form factor>/. .github/workflows/lighthouse.yml runs both.

const PORT = 4317;
const formFactor = process.env.LHCI_FORM_FACTOR === "desktop" ? "desktop" : "mobile";

// The marketing home page, the docs landing page and a blog post: one page
// from each layout the site is built from.
const PAGES = ["/", "/docs", "/blog/stop-making-ai-write-json"];

// Performance swings a lot between CI runners, so it only warns. The other
// categories are deterministic enough to fail the check when they regress.
const performanceFloor = formFactor === "desktop" ? 0.85 : 0.6;

module.exports = {
  ci: {
    collect: {
      startServerCommand: `pnpm exec next start -p ${PORT}`,
      startServerReadyPattern: "Ready in",
      url: PAGES.map((path) => `http://localhost:${PORT}${path}`),
      numberOfRuns: 3,
      settings: {
        ...(formFactor === "desktop" ? { preset: "desktop" } : {}),
        // GitHub-hosted runners have no sandbox-capable user namespace.
        chromeFlags: "--no-sandbox --headless=new",
      },
    },
    assert: {
      assertions: {
        "categories:performance": [
          "warn",
          { minScore: performanceFloor, aggregationMethod: "median-run" },
        ],
        "categories:accessibility": ["error", { minScore: 0.95, aggregationMethod: "median-run" }],
        "categories:best-practices": ["error", { minScore: 0.95, aggregationMethod: "median-run" }],
        "categories:seo": ["error", { minScore: 0.95, aggregationMethod: "median-run" }],
      },
    },
    upload: {
      target: "filesystem",
      outputDir: `lighthouse-reports/${formFactor}`,
    },
  },
};
