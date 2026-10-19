#!/usr/bin/env node
// Fails when a URL the site used to serve is gone and no redirect in redirects.mjs covers it.
//
// URLs are derived from files, so no build is needed: docs and blog MDX under content/, and
// static page.tsx / route.ts files under app/. The URLs at a base git ref are compared with the
// working tree, and every URL that disappeared must be redirected to a URL that still exists
// (following redirect chains).
//
//   node scripts/check-removed-urls.mjs                 # compare against origin/main
//   node scripts/check-removed-urls.mjs --base <ref>    # compare against another ref
//   node scripts/check-removed-urls.mjs --history       # every URL any past commit served
//   add --verbose to print where each removed URL redirects

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { caseRedirects, redirects } from "../redirects.mjs";

const docsDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = execFileSync("git", ["rev-parse", "--show-toplevel"], {
  cwd: docsDir,
  encoding: "utf8",
}).trim();
const docsPrefix = relative(repoRoot, docsDir).split("\\").join("/");

/** Runs git from the repository root, so every path in and out is repository-relative. */
function git(...args) {
  return execFileSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
    maxBuffer: 256 * 1024 * 1024,
  });
}

const args = process.argv.slice(2);
const history = args.includes("--history");
const verbose = args.includes("--verbose");
const baseRef = args.includes("--base") ? args[args.indexOf("--base") + 1] : "origin/main";

// ── URL derivation ──────────────────────────────────────────────────────────

/** `files` are paths relative to docs/. `readFile` reads one of them at the same revision. */
function urlsFromFiles(files, readFile) {
  const urls = new Set();
  const dynamicRoutes = [];
  const topLevelSections = readTopLevelSections(readFile);

  for (const file of files) {
    let match;
    if ((match = file.match(/^content\/docs\/(.+)\.mdx?$/))) {
      const slug = match[1].replace(/(^|\/)index$/, "");
      const section = slug.split("/")[0];
      urls.add(topLevelSections.includes(section) ? `/${slug}` : slug ? `/docs/${slug}` : "/docs");
    } else if ((match = file.match(/^content\/blog\/(.+)\.mdx?$/))) {
      urls.add(`/blog/${match[1].replace(/(^|\/)index$/, "")}`);
    } else if (
      (match = file.match(/^app\/(.*?)\/?(?:page\.(?:tsx|ts|jsx|js|mdx)|route\.(?:ts|js))$/))
    ) {
      const segments = match[1]
        .split("/")
        .filter((segment) => segment && !/^\(.*\)$/.test(segment) && !segment.startsWith("@"));
      // Private folders, API routes and the generated Markdown mirrors are not pages people link to.
      if (segments.some((segment) => segment.startsWith("_"))) continue;
      if (["api", "llms.mdx", "og"].includes(segments[0])) continue;
      // An optional catch-all also serves its parent path.
      if (segments.at(-1)?.startsWith("[[...")) segments.pop();
      const route = `/${segments.join("/")}`;
      if (route.includes("[")) dynamicRoutes.push(dynamicRouteRegex(route));
      else urls.add(route);
    }
  }
  return { urls, dynamicRoutes };
}

function readTopLevelSections(readFile) {
  const source = readFile("lib/source.ts") ?? "";
  const match = source.match(/TOP_LEVEL_SECTIONS\s*=\s*\[([^\]]*)\]/);
  return match ? [...match[1].matchAll(/["']([^"']+)["']/g)].map((m) => m[1]) : [];
}

function dynamicRouteRegex(route) {
  const pattern = route
    .split("/")
    .map((segment) => {
      if (segment.startsWith("[[...")) return "(?:/.*)?";
      if (segment.startsWith("[...")) return "/.+";
      if (segment.startsWith("[")) return "/[^/]+";
      return segment ? `/${escapeRegex(segment)}` : "";
    })
    .join("");
  return new RegExp(`^${pattern}$`);
}

function urlsAtRef(ref) {
  const files = git(
    "ls-tree",
    "-r",
    "--name-only",
    ref,
    "--",
    `${docsPrefix}/content`,
    `${docsPrefix}/app`,
  )
    .split("\n")
    .filter(Boolean)
    .map((file) => file.slice(docsPrefix.length + 1));
  return urlsFromFiles(files, (file) => {
    try {
      return git("show", `${ref}:${docsPrefix}/${file}`);
    } catch {
      return undefined;
    }
  });
}

function urlsInWorkingTree() {
  const files = git(
    "ls-files",
    "--cached",
    "--others",
    "--exclude-standard",
    "--",
    `${docsPrefix}/content`,
    `${docsPrefix}/app`,
  )
    .split("\n")
    .filter((file) => file && existsSync(join(repoRoot, file)))
    .map((file) => file.slice(docsPrefix.length + 1));
  return urlsFromFiles(files, (file) => {
    const path = join(docsDir, file);
    return existsSync(path) ? readFileSync(path, "utf8") : undefined;
  });
}

// ── Redirect matching (the subset of Next.js / path-to-regexp syntax this site uses) ──

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Compiles a Next.js `source` like `/docs/:section(a|b)/:path*` into a regex and its param names. */
function compileSource(source) {
  const names = [];
  let pattern = "";
  const tokens = /:(\w+)(\((?:[^()]|\([^()]*\))*\))?([*+?])?/g;
  let last = 0;
  for (let token; (token = tokens.exec(source));) {
    let literal = source.slice(last, token.index);
    const prefix = literal.endsWith("/") ? "/" : "";
    if (prefix) literal = literal.slice(0, -1);
    pattern += escapeRegex(literal);
    const [, name, group, modifier] = token;
    const inner = group ? group.slice(1, -1) : "[^/]+?";
    names.push(name);
    if (modifier === "*" || modifier === "+") {
      const repeated = `((?:${inner})(?:/(?:${inner}))*)`;
      pattern += modifier === "*" ? `(?:${prefix}${repeated})?` : `${prefix}${repeated}`;
    } else if (modifier === "?") {
      pattern += `(?:${prefix}(${inner}))?`;
    } else {
      pattern += `${prefix}(${inner})`;
    }
    last = tokens.lastIndex;
  }
  pattern += escapeRegex(source.slice(last));
  return { names, pattern: `^${pattern}/?$` };
}

const compiledRedirects = redirects.map((redirect) => ({
  ...redirect,
  ...compileSource(redirect.source),
}));

function applyRedirect(url) {
  if (caseRedirects[url]) return { destination: caseRedirects[url] };
  for (const redirect of compiledRedirects) {
    // Conditional redirects don't apply to every request, so they can't stand in for a removed page.
    if (redirect.has || redirect.missing) continue;
    // Next.js matches redirect sources case-insensitively (unless experimental.caseSensitiveRoutes).
    const match = url.match(new RegExp(redirect.pattern, "i"));
    if (!match) continue;
    const params = Object.fromEntries(redirect.names.map((name, i) => [name, match[i + 1] ?? ""]));
    const destination = redirect.destination.replace(/:(\w+)(\([^)]*\))?[*+?]?/g, (whole, name) =>
      name in params ? params[name] : whole,
    );
    return { redirect, destination: destination.replace(/(.)\/+$/, "$1").replace(/\/{2,}/g, "/") };
  }
  return undefined;
}

// ── Check ───────────────────────────────────────────────────────────────────

const head = urlsInWorkingTree();
const isServed = (url) => head.urls.has(url) || head.dynamicRoutes.some((regex) => regex.test(url));

/** Follows redirects from `url`; returns the chain and whether it ends on a page that exists. */
function resolve(url) {
  const chain = [url];
  let current = url;
  for (let result; (result = applyRedirect(current));) {
    current = result.destination;
    if (chain.includes(current)) return { chain: [...chain, current], ok: false, loop: true };
    chain.push(current);
    if (/^https?:\/\//.test(current)) return { chain, ok: true };
  }
  const path = current.split(/[?#]/)[0];
  return { chain, ok: chain.length > 1 && isServed(path) };
}

let before = new Set();
let label;
if (history) {
  label = "any commit in history";
  const commits = git("log", "--format=%H", "--", `${docsPrefix}/content`, `${docsPrefix}/app`)
    .split("\n")
    .filter(Boolean);
  for (const commit of commits) for (const url of urlsAtRef(commit).urls) before.add(url);
} else {
  const base = git("merge-base", baseRef, "HEAD").trim();
  label = `${baseRef} (${base.slice(0, 9)})`;
  before = urlsAtRef(base).urls;
}

const removed = [...before].filter((url) => !isServed(url)).sort();
const failures = [];
for (const url of removed) {
  const { chain, ok, loop } = resolve(url);
  if (!ok) failures.push({ url, chain, loop });
  if (verbose) console.log(`${ok ? "ok  " : "FAIL"} ${chain.join(" → ")}`);
}

console.log(
  `Checked ${removed.length} URL(s) served at ${label} that the working tree no longer serves.`,
);
if (failures.length === 0) {
  console.log("Every removed URL redirects to a page that exists.");
  process.exit(0);
}

console.error(`\n${failures.length} removed URL(s) have no working redirect:\n`);
for (const { url, chain, loop } of failures) {
  if (chain.length === 1) console.error(`  ${url}`);
  else
    console.error(
      `  ${chain.join(" → ")}  (${loop ? "redirect loop" : "destination does not exist"})`,
    );
}
console.error(
  `\nAdd an entry to ${docsPrefix}/redirects.mjs for each one, pointing at the page that replaced it.`,
);
process.exit(1);
