import * as fs from "node:fs";
import * as path from "node:path";
import { BackendFramework } from "./create-types";
import { CreateError } from "./telemetry";

export const BACKENDS_DIR = "backends";
export const BACKEND_MANIFEST = "manifest.json";

/**
 * Describes everything a backend overlay changes beyond the files it ships.
 * The overlay's own files are copied implicitly; each key below names one
 * other surface the backend needs to touch.
 */
export type BackendManifest = {
  /** Merged into the scaffolded package.json. */
  packageJson?: {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    scripts?: Record<string, string>;
    /** Base-template dependencies this backend makes redundant. */
    removeDependencies?: string[];
  };
  /** Applied after the overlay's files are copied. */
  files?: {
    /** Base-template paths this backend supersedes, relative to the project root. */
    remove?: string[];
  };
  /** Printed after scaffolding. `{{packageManager}}` is substituted. */
  gettingStarted?: string;
};

export type BackendOverlay = {
  dir: string;
  manifest: BackendManifest;
};

export function resolveBackendOverlay(
  templateDir: string,
  backendFramework: BackendFramework,
): BackendOverlay | undefined {
  if (backendFramework === "default") return undefined;

  const overlayDir = path.join(templateDir, BACKENDS_DIR, backendFramework);
  const manifestPath = path.join(overlayDir, BACKEND_MANIFEST);
  if (!fs.existsSync(manifestPath)) {
    throw new CreateError(
      "template_missing",
      `Backend overlay "${backendFramework}" not found. Rebuild the CLI with \`pnpm build\`.`,
    );
  }

  return {
    dir: overlayDir,
    manifest: JSON.parse(fs.readFileSync(manifestPath, "utf8")) as BackendManifest,
  };
}

export function applyBackendOverlay(projectDir: string, backendOverlay?: BackendOverlay) {
  if (!backendOverlay) return;

  for (const entry of fs.readdirSync(backendOverlay.dir)) {
    if (entry === BACKEND_MANIFEST) continue;
    fs.cpSync(path.join(backendOverlay.dir, entry), path.join(projectDir, entry), {
      recursive: true,
    });
  }

  for (const relativePath of backendOverlay.manifest.files?.remove ?? []) {
    fs.rmSync(path.join(projectDir, relativePath), { recursive: true, force: true });
  }
}
