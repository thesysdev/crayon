import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import * as tar from "tar";

// Templates are fetched from the repo's main branch at scaffold time (the
// create-next-app --example model), so template changes — version bumps, new
// files — go live by merging a PR, without publishing a new CLI. They are not
// shipped in the npm package.
const TEMPLATE_REPO = "thesysdev/openui";
const TEMPLATE_PATH_IN_REPO = "packages/openui-cli/src/templates";
const FETCH_TIMEOUT_MS = 15_000;

export interface FetchedTemplate {
  dir: string;
  /** Removes the temp extraction dir once the scaffold copy is done. */
  cleanup: () => void;
}

export async function fetchTemplate(template: string): Promise<FetchedTemplate> {
  // codeload serves plain tarballs for any ref without the rate limits of
  // api.github.com.
  const url = `https://codeload.github.com/${TEMPLATE_REPO}/tar.gz/main`;
  let response: Response;
  try {
    response = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
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

  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "openui-template-"));
  const cleanup = () => fs.rmSync(tempRoot, { recursive: true, force: true });
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
