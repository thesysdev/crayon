#!/usr/bin/env node
// Fails when a page that exists on the base branch is removed or renamed without a redirect in
// next.config.mjs to a page that still exists.
//
// Page URLs come from files (docs and blog MDX under content/, page.tsx and route.ts under app/),
// so no build is needed. Redirects are matched with Next.js's own path matcher.
//
//   node scripts/check-removed-urls.mjs [--base <ref>]   # default: origin/main

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { getPathMatch } = require("next/dist/shared/lib/router/utils/path-match");
const { compile } = require("next/dist/compiled/path-to-regexp");

const docsDir = fileURLToPath(new URL("..", import.meta.url));
const args = process.argv.slice(2);
const baseRef = args.includes("--base") ? args[args.indexOf("--base") + 1] : "origin/main";

const git = (...gitArgs) =>
  execFileSync("git", gitArgs, { cwd: docsDir, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });

/** Page URLs for `files` (paths relative to docs/). `readFile` reads one at the same revision. */
function pageUrls(files, readFile) {
  const sectionsMatch = readFile("lib/source.ts")?.match(/TOP_LEVEL_SECTIONS\s*=\s*\[([^\]]*)\]/);
  const topLevelSections = sectionsMatch
    ? [...sectionsMatch[1].matchAll(/"([^"]+)"/g)].map((m) => m[1])
    : [];
  const urls = new Set();
  const dynamicRoutes = [];

  for (const file of files) {
    let match;
    if ((match = file.match(/^content\/docs\/(.+)\.mdx?$/))) {
      const slug = match[1].replace(/(^|\/)index$/, "");
      urls.add(
        topLevelSections.includes(slug.split("/")[0])
          ? `/${slug}`
          : `/docs/${slug}`.replace(/\/$/, ""),
      );
    } else if ((match = file.match(/^content\/blog\/(.+)\.mdx?$/))) {
      urls.add(`/blog/${match[1]}`);
    } else if (
      (match = file.match(/^app\/(.*?)\/?(?:page\.(?:tsx|ts|jsx|js|mdx)|route\.(?:ts|js))$/))
    ) {
      // Route groups don't appear in the URL; private folders, API routes and generated mirrors aren't pages.
      const segments = match[1].split("/").filter((s) => s && !/^\(.*\)$/.test(s));
      if (
        segments.some((s) => s.startsWith("_")) ||
        ["api", "llms.mdx", "og"].includes(segments[0])
      )
        continue;
      // Catch-all routes render content/ pages, which are listed above; an optional one also
      // serves its parent path.
      if (segments.at(-1)?.startsWith("[[...")) segments.pop();
      if (segments.some((s) => s.startsWith("[..."))) continue;
      const route = `/${segments.join("/")}`;
      if (route.includes("[")) {
        dynamicRoutes.push(new RegExp(`^${route.replace(/\[\w+\]/g, "[^/]+")}$`));
      } else {
        urls.add(route);
      }
    }
  }
  return { urls, dynamicRoutes };
}

const base = git("merge-base", baseRef, "HEAD").trim();
const before = pageUrls(
  git("ls-tree", "-r", "--name-only", base, "--", "content", "app").split("\n").filter(Boolean),
  (file) => {
    try {
      return git("show", `${base}:./${file}`);
    } catch {
      return undefined;
    }
  },
).urls;
const after = pageUrls(
  git("ls-files", "--cached", "--others", "--exclude-standard", "--", "content", "app", "lib")
    .split("\n")
    .filter((file) => file && existsSync(join(docsDir, file))),
  (file) =>
    existsSync(join(docsDir, file)) ? readFileSync(join(docsDir, file), "utf8") : undefined,
);
const exists = (url) => after.urls.has(url) || after.dynamicRoutes.some((regex) => regex.test(url));

const config = (await import("../next.config.mjs")).default;
const redirects = (await config.redirects()).map((redirect) => ({
  ...redirect,
  // The options Next.js uses for redirects (server/lib/router-utils/filesystem.js).
  match: getPathMatch(redirect.source, { strict: true, removeUnnamedParams: true }),
}));

/** Follows redirects from `url` and returns every hop, flagging a loop or a missing destination. */
function followRedirects(url) {
  const chain = [url];
  for (;;) {
    const current = chain.at(-1);
    const redirect = redirects.find((r) => !r.has && !r.missing && r.match(current));
    if (!redirect) {
      return {
        chain,
        problem: chain.length === 1 || exists(current) ? null : "destination does not exist",
      };
    }
    if (/^https?:\/\//.test(redirect.destination))
      return { chain: [...chain, redirect.destination], problem: null };
    const [path] = compile(redirect.destination, { validate: false })(
      redirect.match(current),
    ).split(/[?#]/);
    if (chain.includes(path)) return { chain: [...chain, path], problem: "redirect loop" };
    chain.push(path);
  }
}

const removed = [...before].filter((url) => !exists(url)).sort();
const failures = removed
  .map(followRedirects)
  .filter(({ chain, problem }) => chain.length === 1 || problem);

console.log(`${removed.length} URL(s) on ${baseRef} (${base.slice(0, 9)}) are no longer pages.`);
if (failures.length === 0) process.exit(0);

console.error(`\n${failures.length} removed URL(s) have no working redirect:\n`);
for (const { chain, problem } of failures) {
  console.error(`  ${chain.join(" → ")}${problem ? `  (${problem})` : ""}`);
}
console.error(
  "\nAdd a redirect to docs/next.config.mjs for each one, pointing at the page that replaced it.",
);
process.exit(1);
