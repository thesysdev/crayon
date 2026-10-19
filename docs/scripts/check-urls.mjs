#!/usr/bin/env node
// docs/urls.txt lists every URL that must keep working: each page the site serves, and each old
// URL that now redirects. Lines are only ever added. This script fails when any of them stops
// working: a page removed without a redirect, a redirect removed, or a line deleted from the file.
// Run it after `next build`; pages and redirects come from the build's manifests.
//
//   node scripts/check-urls.mjs [--base <ref>]   # check (base defaults to origin/main)
//   node scripts/check-urls.mjs --write          # add new pages to urls.txt

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { getPathMatch } = require("next/dist/shared/lib/router/utils/path-match");
const { compile } = require("next/dist/compiled/path-to-regexp");

const docsDir = fileURLToPath(new URL("..", import.meta.url));
const urlsFile = `${docsDir}urls.txt`;
const args = process.argv.slice(2);
const baseRef = args.includes("--base") ? args[args.indexOf("--base") + 1] : "origin/main";

const readJson = (file) => JSON.parse(readFileSync(`${docsDir}.next/${file}`, "utf8"));
const prerender = readJson("prerender-manifest.json");
const routes = readJson("routes-manifest.json");
const readLines = (text) => text.split("\n").filter(Boolean);

// Every static page plus every page a dynamic route prerendered from generateStaticParams. OG images,
// Markdown mirrors, API routes and Next.js internals are not pages people link to.
const pages = new Set(
  [...routes.staticRoutes.map((route) => route.page), ...Object.keys(prerender.routes)].filter(
    (url) => !/^\/(og|llms\.mdx|api|_not-found|_global-error)(\/|$)/.test(url),
  ),
);
const listed = existsSync(urlsFile) ? [...new Set(readLines(readFileSync(urlsFile, "utf8")))] : [];

if (args.includes("--write")) {
  const all = [...new Set([...listed, ...pages])].sort();
  writeFileSync(urlsFile, `${all.join("\n")}\n`);
  console.log(`urls.txt: ${all.length} URLs, ${all.length - listed.length} added.`);
  process.exit(0);
}

const redirects = routes.redirects
  .filter((redirect) => !redirect.internal && !redirect.has && !redirect.missing)
  .map((redirect) => ({
    ...redirect,
    // The options Next.js uses for redirects (server/lib/router-utils/filesystem.js).
    match: getPathMatch(redirect.source, { strict: true, removeUnnamedParams: true }),
  }));

/** Follows redirects from `url`; returns every hop and what's wrong with where it ends, if anything. */
function followRedirects(url) {
  const chain = [url];
  for (;;) {
    const current = chain.at(-1);
    const redirect = redirects.find((r) => r.match(current));
    if (!redirect) {
      if (chain.length === 1) return { chain, problem: "not a page, and no redirect" };
      return { chain, problem: pages.has(current) ? null : "destination does not exist" };
    }
    if (/^https?:\/\//.test(redirect.destination)) {
      return { chain: [...chain, redirect.destination], problem: null };
    }
    const destination = compile(redirect.destination, { validate: false })(redirect.match(current));
    const [path] = destination.split(/[?#]/);
    if (chain.includes(path)) return { chain: [...chain, path], problem: "redirect loop" };
    chain.push(path);
  }
}

const git = (...gitArgs) =>
  execFileSync("git", gitArgs, {
    cwd: docsDir,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  });
const base = git("merge-base", baseRef, "HEAD").trim();
let baseListed = [];
try {
  baseListed = readLines(git("show", `${base}:./urls.txt`));
} catch {
  // urls.txt doesn't exist on the base branch yet.
}

const errors = [];

const deleted = baseListed.filter((url) => !listed.includes(url));
if (deleted.length > 0) {
  errors.push(
    `These URLs were deleted from urls.txt. Keep them, and redirect any that are no longer pages:\n` +
      deleted.map((url) => `  ${url}`).join("\n"),
  );
}

const missing = [...pages].filter((url) => !listed.includes(url)).sort();
if (missing.length > 0) {
  errors.push(
    "These pages aren't in urls.txt. Run `pnpm build && pnpm check:urls --write` and commit it:\n" +
      missing.map((url) => `  ${url}`).join("\n"),
  );
}

const broken = [...new Set([...baseListed, ...listed])]
  .filter((url) => !pages.has(url))
  .map(followRedirects)
  .filter(({ problem }) => problem);
if (broken.length > 0) {
  errors.push(
    "These URLs no longer work. Add a redirect in docs/next.config.mjs to the page that replaced each one:\n" +
      broken.map(({ chain, problem }) => `  ${chain.join(" → ")}  (${problem})`).join("\n"),
  );
}

if (errors.length > 0) {
  console.error(errors.join("\n\n"));
  process.exit(1);
}
const redirected = listed.length - listed.filter((url) => pages.has(url)).length;
console.log(
  `All ${listed.length} URLs in urls.txt work: ${pages.size} pages, ${redirected} redirected.`,
);
