// Fails a PR that changes what readers see on a docs page, blog post or integration without moving
// its `updatedAt` forward. `updatedAt` is the page's sitemap lastmod.
//
// Usage: node docs/scripts/check-updated-at.mjs [base-ref] [head-ref]   (default: origin/main HEAD)
//
// Whitespace and Markdown table padding don't count as changes, nor do the metadata fields below.
// Label the PR `no-date-bump` to skip the check for typo-level edits.
import { execFileSync } from "node:child_process";

const INTEGRATIONS = "docs/app/(home)/integrations/data.ts";
const PAGE_METADATA = [
  "updatedAt",
  "date",
  "featured",
  "seoTitle",
  "ogImage",
  "customHeader",
  "hideFooter",
  "sidebar",
  "pageActions",
  "icon",
  "full",
];
const INTEGRATION_METADATA = ["updatedAt", "seoTitle", "logo"];

const git = (...args) => execFileSync("git", args, { encoding: "utf8", maxBuffer: 1 << 26 });

/** The file at `ref`, or undefined when it doesn't exist there. */
function show(ref, path) {
  try {
    return execFileSync("git", ["show", `${ref}:${path}`], {
      encoding: "utf8",
      maxBuffer: 1 << 26,
      stdio: ["ignore", "pipe", "ignore"],
    });
  } catch {
    return undefined;
  }
}

/** Drops `fields` written at `indent`, with any lines nested under them. */
const without = (text, fields, indent = "") =>
  text.replace(
    new RegExp(`^${indent}(?:${fields.join("|")}):.*\\n(?:${indent}[ \\t].*\\n)*`, "gm"),
    "",
  );

// Prettier re-pads Markdown table rows when a column widens; compare them without padding.
const normalize = (text) =>
  text
    .replace(/^\|.*$/gm, (row) => row.replace(/\s+/g, "").replace(/-+/g, "-"))
    .replace(/\s+/g, " ")
    .trim();

const field = (text, name) => text.match(new RegExp(`^\\s*${name}:\\s*["']?([\\w-]+)`, "m"))?.[1];

function page(text) {
  const [, frontmatter = "", body = text] = text.match(/^---\n([\s\S]*?\n)---\n([\s\S]*)$/) ?? [];
  return {
    content: normalize(without(frontmatter, PAGE_METADATA) + body),
    updatedAt: field(frontmatter, "updatedAt"),
    date: field(frontmatter, "date"),
  };
}

/** Integration entries by slug: each `  {` … `  },` block with a `slug`. */
function integrations(text = "") {
  const entries = new Map();
  for (const block of text.split(/^ {2}\{\n/m).slice(1)) {
    const entry = block.split(/^ {2}\},?$/m)[0];
    const slug = field(entry, "slug");
    if (!slug) continue;
    entries.set(slug, {
      content: normalize(without(entry, INTEGRATION_METADATA, " {4}")),
      updatedAt: field(entry, "updatedAt"),
    });
  }
  return entries;
}

/** True for a real calendar day written YYYY-MM-DD. */
function isDay(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const time = Date.parse(date);
  // Round-trip so impossible days like 2026-02-30 fail.
  return !Number.isNaN(time) && new Date(time).toISOString().startsWith(date);
}

const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);

/** What's wrong with `after`'s date, given `before` (undefined when new), or undefined. */
function problem(before, after, { required, notBefore }) {
  const date = after.updatedAt;
  if (before && date === before.updatedAt) {
    if (after.content === before.content) return;
    return `content changed but updatedAt is ${date ? `still ${date}` : "not set"}`;
  }
  if (!date) return required || before?.updatedAt ? "updatedAt is missing" : undefined;
  if (!isDay(date)) return `${date} isn't a YYYY-MM-DD date`;
  // Tomorrow, not today, so authors ahead of UTC can use their local date.
  if (date > tomorrow) return `${date} is in the future`;
  if (before?.updatedAt && date <= before.updatedAt)
    return `${date} isn't after ${before.updatedAt}`;
  if (notBefore && date < notBefore) return `${date} is before the post's date ${notBefore}`;
}

const [baseRef = "origin/main", headRef = "HEAD"] = process.argv.slice(2);
const base = git("merge-base", baseRef, headRef).trim();
const changed = git(
  "diff",
  "--name-only",
  "--no-renames",
  "--diff-filter=AM",
  base,
  headRef,
  "--",
  "docs/content",
  INTEGRATIONS,
)
  .split("\n")
  .filter(Boolean);

const problems = [];
for (const path of changed) {
  if (path === INTEGRATIONS) {
    const before = integrations(show(base, path));
    for (const [slug, entry] of integrations(show(headRef, path))) {
      const message = problem(before.get(slug), entry, { required: true });
      if (message) problems.push({ path, message: `${slug}: ${message}` });
    }
  } else if (/\.mdx?$/.test(path)) {
    const isBlog = path.startsWith("docs/content/blog/");
    const before = show(base, path);
    const after = page(show(headRef, path));
    const message = problem(before && page(before), after, {
      required: !isBlog,
      notBefore: isBlog ? after.date : undefined,
    });
    if (message) problems.push({ path, message });
  }
}

if (problems.length === 0) {
  console.log("Every changed page has a current updatedAt.");
} else {
  for (const { path, message } of problems) {
    console.log(`- ${path}: ${message}`);
    if (process.env.GITHUB_ACTIONS) console.log(`::error file=${path}::${message}`);
  }
  const today = new Date().toISOString().slice(0, 10);
  console.log(
    `\nSet updatedAt to ${today} on each, or label the PR no-date-bump if the edits don't change what readers get.`,
  );
  process.exitCode = 1;
}
