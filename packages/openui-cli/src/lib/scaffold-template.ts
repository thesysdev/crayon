import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import { checkoutSource } from "./checkout";
import { openUiSourceRoots } from "./source-roots";
import { CreateError } from "./telemetry";

export const TEMPLATES_DIR = "templates";

export type ResolvedTemplate = {
  dir: string;
  origin: "local" | "github";
};

function findLocalTemplateDir(template: string, sourceRoot?: string): string | undefined {
  for (const root of openUiSourceRoots(sourceRoot)) {
    const candidate = path.join(root, TEMPLATES_DIR, template);
    if (fs.existsSync(path.join(candidate, "package.json"))) return candidate;
  }
  return undefined;
}

export async function resolveTemplateSource(
  template: string,
  sourceRoot?: string,
): Promise<ResolvedTemplate> {
  const localDir = findLocalTemplateDir(template, sourceRoot);
  if (localDir) return { dir: localDir, origin: "local" };

  const dest = fs.mkdtempSync(path.join(os.tmpdir(), "openui-template-"));
  try {
    const checkedOut = await checkoutSource(`${TEMPLATES_DIR}/${template}`, { dest });
    return { dir: checkedOut.dir, origin: "github" };
  } catch (err) {
    fs.rmSync(dest, { recursive: true, force: true });
    if (err instanceof CreateError) throw err;
    throw new CreateError(
      "preflight",
      err instanceof Error ? err.message : String(err),
      "network",
      "TEMPLATE_MISSING",
    );
  }
}
