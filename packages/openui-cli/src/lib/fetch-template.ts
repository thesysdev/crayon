import { execFile } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { promisify } from "node:util";

import * as tar from "tar";

// Templates live in the dedicated thesysdev/openui-templates repo: one folder
// per template at the root, listed in index.json. They are fetched from main
// at scaffold time, so template changes go live on merge — no CLI release.
// Fetches start in the background as soon as they can (see prefetch*) so the
// network overlaps with the interactive prompts instead of blocking scaffold.
const TEMPLATES_REPO = "thesysdev/openui-templates";
const INDEX_URL = `https://raw.githubusercontent.com/${TEMPLATES_REPO}/main/index.json`;

const execFileAsync = promisify(execFile);

export interface TemplateIndexEntry {
  name: string;
  description: string;
}

export interface FetchedTemplate {
  dir: string;
  /** Removes the temp extraction dir once the scaffold copy is done. */
  cleanup: () => void;
}

// Prefetched templates that were never consumed (user cancelled mid-prompt)
// still get their temp dirs removed on exit.
const pendingCleanups = new Set<() => void>();
process.on("exit", () => {
  for (const cleanup of pendingCleanups) cleanup();
});

function makeTempRoot(): { tempRoot: string; cleanup: () => void } {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "openui-template-"));
  const cleanup = () => {
    pendingCleanups.delete(cleanup);
    // maxRetries: git object files are read-only, which Windows rm can race on.
    fs.rmSync(tempRoot, { recursive: true, force: true, maxRetries: 3 });
  };
  pendingCleanups.add(cleanup);
  return { tempRoot, cleanup };
}

/** Sparse partial clone: transfers only commit/tree metadata plus the
 * requested template's blobs. Returns `null` when git is unavailable or the
 * clone fails, so the caller can fall back to the tarball download.
 **/
async function tryGitSparseFetch(template: string): Promise<FetchedTemplate | null> {
  const git = (args: string[]) =>
    // autocrlf=false: byte-identical checkout even when the user's global git
    // config would rewrite line endings (Windows default).
    execFileAsync("git", ["-c", "core.autocrlf=false", ...args], { timeout: 60_000 });
  try {
    await git(["--version"]);
  } catch {
    return null;
  }

  const { tempRoot, cleanup } = makeTempRoot();
  const repoDir = path.join(tempRoot, "repo");
  try {
    // Step 1: clone the latest main commit with tree metadata only —
    // --depth=1 (no history), --filter=blob:none (no file contents yet),
    // --sparse (start with just the repo-root files checked out).
    await git([
      "clone",
      "--depth=1",
      "--filter=blob:none",
      "--sparse",
      "--single-branch",
      "--branch=main",
      `https://github.com/${TEMPLATES_REPO}.git`,
      repoDir,
    ]);
    // Step 2: widen the checkout to the template's folder — git fetches only
    // that subtree's blobs and writes them into the working tree.
    await git(["-C", repoDir, "sparse-checkout", "set", template]);
  } catch {
    cleanup();
    return null;
  }

  const dir = path.join(repoDir, template);
  if (!fs.existsSync(path.join(dir, "package.json"))) {
    // The clone worked, so the template genuinely doesn't exist on main —
    // don't burn a tarball download discovering the same thing.
    cleanup();
    throw new Error(`Template "${template}" not found`);
  }
  return { dir, cleanup };
}

async function fetchTemplateTarball(template: string): Promise<FetchedTemplate> {
  // codeload serves plain tarballs for any ref without the rate limits of
  // api.github.com.
  const url = `https://codeload.github.com/${TEMPLATES_REPO}/tar.gz/main`;
  let response: Response;
  try {
    response = await fetch(url, { signal: AbortSignal.timeout(120_000) });
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    throw new Error(
      `Could not download the "${template}" template from GitHub (${reason}). ` +
        "Scaffolding needs network access — check your connection and retry.",
    );
  }
  if (!response.ok) {
    throw new Error(`Template download failed: ${url} responded ${response.status}`);
  }

  const tarball = Buffer.from(await response.arrayBuffer());

  const { tempRoot, cleanup } = makeTempRoot();
  try {
    const tarFile = path.join(tempRoot, "repo.tgz");
    const extractDir = path.join(tempRoot, template);
    fs.writeFileSync(tarFile, tarball);
    fs.mkdirSync(extractDir);
    // Entries are prefixed "<repo>-<ref>/"; keep only the requested template's
    // folder and strip the prefix so it extracts at extractDir.
    await tar.extract({
      file: tarFile,
      cwd: extractDir,
      strip: 2,
      filter: (entryPath: string) => entryPath.split("/")[1] === template,
    });
    if (!fs.existsSync(path.join(extractDir, "package.json"))) {
      throw new Error(`Template "${template}" not found`);
    }
    return { dir: extractDir, cleanup };
  } catch (err) {
    cleanup();
    throw err;
  }
}

const templateFetches = new Map<string, Promise<FetchedTemplate>>();

/** Starts downloading a template in the background. Errors are surfaced when
 * the promise is consumed by fetchTemplate at scaffold time. */
export function prefetchTemplate(template: string): void {
  if (templateFetches.has(template)) return;
  const fetching = (async () =>
    (await tryGitSparseFetch(template)) ?? fetchTemplateTarball(template))();
  fetching.catch(() => {}); // avoid unhandled rejection while in the background
  templateFetches.set(template, fetching);
}

export function fetchTemplate(template: string): Promise<FetchedTemplate> {
  prefetchTemplate(template);
  return templateFetches.get(template)!;
}

let indexFetch: Promise<TemplateIndexEntry[] | null> | undefined;

async function fetchIndex(): Promise<TemplateIndexEntry[] | null> {
  const response = await fetch(INDEX_URL, { signal: AbortSignal.timeout(10_000) });
  if (!response.ok) return null;
  const parsed = (await response.json()) as { templates?: TemplateIndexEntry[] };
  const templates = parsed.templates?.filter(
    (t) => typeof t?.name === "string" && typeof t?.description === "string",
  );
  return templates?.length ? templates : null;
}

/** Starts downloading index.json in the background. */
export function prefetchTemplateIndex(): void {
  indexFetch ??= fetchIndex().catch(() => null);
}

/** Resolves to the template list, or null when the index can't be fetched —
 * callers fall back to the built-in list. */
export function getTemplateIndex(): Promise<TemplateIndexEntry[] | null> {
  prefetchTemplateIndex();
  return indexFetch!;
}
