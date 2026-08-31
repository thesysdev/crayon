import * as fs from "node:fs";
import * as path from "node:path";
import { OverlayName } from "./create-types";
import { CreateError } from "./telemetry";

export const OVERLAYS_DIR = "overlays";
export const OVERLAY_MANIFEST = "manifest.json";

/**
 * Describes everything a framework overlay changes beyond the files it ships.
 * The overlay's own files are copied implicitly; each key below names one
 * other surface the overlay needs to touch.
 */
export type OverlayManifest = {
  /** Merged into the scaffolded package.json. */
  packageJson?: {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    scripts?: Record<string, string>;
    /** Base-template dependencies this overlay makes redundant. */
    removeDependencies?: string[];
  };
  /** Applied after the overlay's files are copied. */
  files?: {
    /** Base-template paths this overlay supersedes, relative to the project root. */
    remove?: string[];
  };
  /** Printed after scaffolding. `{{packageManager}}` is substituted. */
  gettingStarted?: string;
};

export type TemplateOverlay = {
  dir: string;
  manifest: OverlayManifest;
};

export function resolveOverlay(
  templateDir: string,
  overlayName: OverlayName,
): TemplateOverlay | undefined {
  if (overlayName === "default") return undefined;

  const overlayDir = path.join(templateDir, OVERLAYS_DIR, overlayName);
  const manifestPath = path.join(overlayDir, OVERLAY_MANIFEST);
  if (!fs.existsSync(manifestPath)) {
    throw new CreateError(
      "template_missing",
      `Backend framework "${overlayName}" not found. Rebuild the CLI with \`pnpm build\`.`,
    );
  }

  return {
    dir: overlayDir,
    manifest: JSON.parse(fs.readFileSync(manifestPath, "utf8")) as OverlayManifest,
  };
}

function removeEmptyParentDirs(projectDir: string, removedRelativePath: string) {
  let dir = path.dirname(path.join(projectDir, removedRelativePath));

  while (true) {
    const relative = path.relative(projectDir, dir);
    if (!relative || relative.startsWith("..")) break;
    if (fs.readdirSync(dir).length > 0) break;
    fs.rmdirSync(dir);
    dir = path.dirname(dir);
  }
}

export function applyOverlay(projectDir: string, overlay?: TemplateOverlay) {
  if (!overlay) return;

  for (const entry of fs.readdirSync(overlay.dir)) {
    if (entry === OVERLAY_MANIFEST) continue;
    fs.cpSync(path.join(overlay.dir, entry), path.join(projectDir, entry), {
      recursive: true,
    });
  }

  for (const relativePath of overlay.manifest.files?.remove ?? []) {
    fs.rmSync(path.join(projectDir, relativePath), { recursive: true, force: true });
    removeEmptyParentDirs(projectDir, relativePath);
  }
}
