// Fails a PR that changes what readers see on a docs page, blog post, or integration page without
// bumping its `updatedAt`, so sitemap `lastmod` moves only when content does.
//
// Usage: node docs/scripts/check-updated-at.mjs [base-ref] [head-ref]   (default: origin/main HEAD)
//
// Pages under docs/content: the MDX body plus frontmatter minus METADATA_KEYS. Integrations: each
// entry in data.ts minus INTEGRATION_METADATA_KEYS. Whitespace-only edits and Markdown table
// divider reflows don't count. A changed page or entry needs `updatedAt` set to a YYYY-MM-DD later
// than before; new docs pages and integrations need one, new blog posts are dated by `date`.
// Typo-level edits can skip the check with the `no-date-bump` PR label.
import { execFileSync } from "node:child_process";
import { appendFileSync } from "node:fs";

const CONTENT_PATH = /^docs\/content\/(docs|blog)\/.+\.mdx?$/;
const INTEGRATIONS_PATH = "docs/app/(home)/integrations/data.ts";
// Frontmatter keys that don't change what readers see.
const METADATA_KEYS = new Set([
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
]);
const INTEGRATION_METADATA_KEYS = new Set(["updatedAt", "seoTitle", "logo"]);
const SKIP_LABEL = "no-date-bump";

const git = (...args) =>
  execFileSync("git", args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }).trim();

// Prettier re-pads Markdown table cells and dividers (`|a|---|` → `| a | --- |`) when a column
// widens, so table rows compare without that padding.
const normalizeTableRow = (line) =>
  /^[\s|:-]*-[\s|:-]*$/.test(line) ? "|-|" : line.replace(/\s*\|\s*/g, "|");

const normalize = (lines) =>
  lines
    .map((line) => (/^\s*\|/.test(line) ? normalizeTableRow(line) : line))
    .join("\n")
    .replace(/\s+/g, " ")
    .trim();

/** Drops the fields named in `skipKeys` (keys at `indent`) along with their nested lines. */
function withoutFields(lines, indent, skipKeys) {
  const keyPattern = new RegExp(`^${indent}([A-Za-z_][\\w-]*)\\s*:`);
  const kept = [];
  let keep = true;
  for (const line of lines) {
    const key = line.match(keyPattern)?.[1];
    if (key) keep = !skipKeys.has(key);
    // Lines nested under a field are blank, indented past it, or YAML list items at its indent.
    else if (line.trim() && !line.startsWith(`${indent} `) && !line.startsWith(`${indent}-`)) {
      keep = true;
    }
    if (keep) kept.push(line);
  }
  return kept;
}

function parsePage(text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  const frontmatter = match ? match[1].split(/\r?\n/) : [];
  const body = match ? text.slice(match[0].length) : text;

  const scalar = (key) => {
    const index = frontmatter.findIndex((line) => line.startsWith(`${key}:`));
    if (index === -1) return { value: undefined, line: 1 };
    const raw = frontmatter[index].slice(key.length + 1).trim();
    // +2: the opening `---` is line 1.
    return { value: raw.replace(/^(['"])(.*)\1$/, "$2"), line: index + 2 };
  };

  return {
    content: normalize([...withoutFields(frontmatter, "", METADATA_KEYS), ...body.split("\n")]),
    updatedAt: scalar("updatedAt"),
    date: scalar("date").value,
  };
}

/** Integration entries by slug. An entry runs from the `{` above its `slug:` to its `},`. */
function parseIntegrations(text) {
  const lines = text.split("\n");
  const entries = new Map();
  for (let i = 0; i < lines.length; i++) {
    const slug = lines[i].match(/^ {4}slug: "([^"]+)",$/)?.[1];
    if (!slug) continue;
    let end = i;
    while (end < lines.length - 1 && lines[end] !== "  },") end++;
    const entry = lines.slice(i - 1, end + 1);
    const index = entry.findIndex((line) => line.startsWith("    updatedAt:"));
    entries.set(slug, {
      content: normalize(withoutFields(entry, "    ", INTEGRATION_METADATA_KEYS)),
      updatedAt: {
        value: index === -1 ? undefined : entry[index].match(/"([^"]*)"/)?.[1],
        // entry[k] is file line i + k.
        line: index === -1 ? i + 1 : i + index,
      },
    });
  }
  return entries;
}

/** Problem with the new `updatedAt`, or undefined when it's acceptable. */
function checkDate(value, { previous, notBefore }) {
  const parsed = new Date(value);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== value
  ) {
    return `\`updatedAt: ${value}\` is not a YYYY-MM-DD date.`;
  }
  // A day of slack so authors ahead of UTC can use their local date.
  const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
  if (value > tomorrow) return `\`updatedAt: ${value}\` is in the future.`;
  if (previous && value <= previous) {
    return `\`updatedAt: ${value}\` must be later than the previous \`${previous}\`.`;
  }
  if (notBefore && value < notBefore) {
    return `\`updatedAt: ${value}\` is earlier than the post's \`date: ${notBefore}\`.`;
  }
}

/** Compares two versions of a page or entry (`before` is undefined for a new one). */
function checkVersion(before, after, { requireOnCreate, notBefore, fix }) {
  const line = after.updatedAt.line;
  if (!before) {
    if (requireOnCreate && !after.updatedAt.value) {
      return { line, message: `No \`updatedAt\`. ${fix}` };
    }
  } else if (after.updatedAt.value === before.updatedAt.value) {
    if (after.content === before.content) return;
    const was = before.updatedAt.value ? `still \`${before.updatedAt.value}\`` : "not set";
    return { line, message: `Content changed but \`updatedAt\` is ${was}. ${fix}` };
  }
  if (after.updatedAt.value) {
    const message = checkDate(after.updatedAt.value, {
      previous: before?.updatedAt.value,
      notBefore,
    });
    if (message) return { line, message };
  } else if (before?.updatedAt.value) {
    return { line: 1, message: `\`updatedAt\` was removed. ${fix}` };
  }
}

function main() {
  const baseRef = process.argv[2] ?? "origin/main";
  const headRef = process.argv[3] ?? "HEAD";
  const base = git("merge-base", baseRef, headRef);
  const today = new Date().toISOString().slice(0, 10);
  const skip = `or label the PR \`${SKIP_LABEL}\` if the edit doesn't change what readers get.`;

  const problems = [];
  const changes = git("diff", "--name-status", "-M", base, headRef, "--", "docs/content")
    .split("\n")
    .concat(git("diff", "--name-status", base, headRef, "--", INTEGRATIONS_PATH))
    .filter(Boolean);

  for (const change of changes) {
    const [status, ...paths] = change.split("\t");
    const path = paths.at(-1);
    if (status === "D") continue;
    const basePath = /^[RC]/.test(status) ? paths[0] : status === "A" ? undefined : path;

    if (path === INTEGRATIONS_PATH) {
      const after = parseIntegrations(git("show", `${headRef}:${path}`));
      const before = basePath ? parseIntegrations(git("show", `${base}:${basePath}`)) : new Map();
      for (const [slug, entry] of after) {
        const problem = checkVersion(before.get(slug), entry, {
          requireOnCreate: true,
          fix: `Set its \`updatedAt: "${today}"\`, ${skip}`,
        });
        if (problem)
          problems.push({ path, line: problem.line, message: `\`${slug}\`: ${problem.message}` });
      }
      continue;
    }

    if (!CONTENT_PATH.test(path)) continue;
    const isBlog = path.startsWith("docs/content/blog/");
    const after = parsePage(git("show", `${headRef}:${path}`));
    const before =
      basePath && CONTENT_PATH.test(basePath)
        ? parsePage(git("show", `${base}:${basePath}`))
        : undefined;
    const problem = checkVersion(before, after, {
      requireOnCreate: !isBlog,
      notBefore: isBlog ? after.date : undefined,
      fix: `Set \`updatedAt: ${today}\` in its frontmatter, ${skip}`,
    });
    if (problem) problems.push({ path, ...problem });
  }

  const summary =
    problems.length === 0
      ? ["### Content dates", "", "Every changed page has a current `updatedAt`."]
      : [
          "### Content dates",
          "",
          ...problems.map(({ path, message }) => `- \`${path}\`: ${message}`),
        ];
  console.log(summary.join("\n"));
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary.join("\n") + "\n");
  }
  if (process.env.GITHUB_ACTIONS) {
    for (const { path, line, message } of problems) {
      console.log(`::error file=${path},line=${line}::${message.replaceAll("`", "")}`);
    }
  }
  process.exitCode = problems.length > 0 ? 1 : 0;
}

main();
