import { execFileSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import * as tar from "tar";

const TEMPLATE_PATH_IN_REPO = "packages/openui-cli/src/templates";

export interface FetchedTemplate {
  dir: string;
  /** Removes the temp extraction dir once the scaffold copy is done. */
  cleanup: () => void;
}

function makeTempRoot(): { tempRoot: string; cleanup: () => void } {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "openui-template-"));
  // maxRetries: git object files are read-only, which Windows rm can race on.
  const cleanup = () => fs.rmSync(tempRoot, { recursive: true, force: true, maxRetries: 3 });
  return { tempRoot, cleanup };
}

/** Sparse partial clone: transfers only commit/tree metadata plus the
 * template's blobs (\~1MB) instead of the full repo tarball (\~220MB, dominated
 * by docs media). Returns `null` when git is unavailable or the clone fails, so
 * the caller can fall back to the tarball download.
 **/
function tryGitSparseFetch(template: string): FetchedTemplate | null {
  try {
    execFileSync("git", ["--version"], { stdio: "ignore" });
  } catch {
    return null;
  }

  const { tempRoot, cleanup } = makeTempRoot();
  const repoDir = path.join(tempRoot, "repo");
  const git = (args: string[]) =>
    execFileSync("git", args, { stdio: ["ignore", "ignore", "pipe"], timeout: 60_000 });
  try {
    // Step 1: clone the latest main commit with tree metadata only —
    // --depth=1 (no history), --filter=blob:none (no file contents yet),
    // --sparse (start with just the repo-root files checked out).
    git([
      "clone",
      "--depth=1",
      "--filter=blob:none",
      "--sparse",
      "--single-branch",
      "--branch=main",
      "https://github.com/thesysdev/openui.git",
      repoDir,
    ]);
    // Step 2: widen the checkout to the template's folder — git fetches only
    // that subtree's blobs and writes them into the working tree.
    git(["-C", repoDir, "sparse-checkout", "set", `${TEMPLATE_PATH_IN_REPO}/${template}`]);
  } catch {
    cleanup();
    return null;
  }

  const dir = path.join(repoDir, TEMPLATE_PATH_IN_REPO, template);
  if (!fs.existsSync(path.join(dir, "package.json"))) {
    // The template genuinely doesn't exist on main —
    // don't burn a full tarball download discovering the same thing.
    cleanup();
    throw new Error(`Template "${template}" not found`);
  }
  return { dir, cleanup };
}

async function fetchTemplateTarball(template: string): Promise<FetchedTemplate> {
  // codeload serves plain tarballs for any ref without the rate limits of
  // api.github.com.
  const url = `https://codeload.github.com/thesysdev/openui/tar.gz/main`;
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
    // subtree and strip the leading segments so it extracts at extractDir.
    const wanted = `${TEMPLATE_PATH_IN_REPO}/${template}`;
    const wantedDepth = wanted.split("/").length;
    await tar.extract({
      file: tarFile,
      cwd: extractDir,
      strip: wantedDepth + 1,
      filter: (entryPath: string) =>
        entryPath
          .split("/")
          .slice(1, wantedDepth + 1)
          .join("/") === wanted,
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

export async function fetchTemplate(template: string): Promise<FetchedTemplate> {
  return tryGitSparseFetch(template) ?? fetchTemplateTarball(template);
}
