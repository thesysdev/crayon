import * as path from "node:path";

export function openUiSourceRoots(sourceRoot?: string): string[] {
  return [
    sourceRoot,
    process.env["OPENUI_CLI_SOURCE_ROOT"],
    path.resolve(__dirname, "..", "..", "..", ".."),
  ].filter((root): root is string => Boolean(root));
}
