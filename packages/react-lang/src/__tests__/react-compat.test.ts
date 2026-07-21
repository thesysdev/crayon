import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, test } from "vitest";

const react18OnlyHooks = ["useInsertionEffect", "useSyncExternalStore"];

function listSourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const file = join(dir, name);
    const stat = statSync(file);
    if (stat.isDirectory()) {
      if (name === "__tests__") return [];
      return listSourceFiles(file);
    }
    return /\.(ts|tsx)$/.test(name) ? [file] : [];
  });
}

describe("React compatibility", () => {
  test("does not import React 18-only hooks directly from react", () => {
    const srcRoot = join(process.cwd(), "src");
    const violations = listSourceFiles(srcRoot).flatMap((file) => {
      const source = readFileSync(file, "utf8");
      const matches = react18OnlyHooks.filter((hook) => {
        const namedImport = new RegExp(
          `import\\s*\\{[^}]*\\b${hook}\\b[^}]*\\}\\s*from\\s*["']react["']`,
        );
        const mixedImport = new RegExp(
          `import\\s+[^;{]+,\\s*\\{[^}]*\\b${hook}\\b[^}]*\\}\\s*from\\s*["']react["']`,
        );
        return namedImport.test(source) || mixedImport.test(source);
      });
      return matches.map((hook) => `${relative(srcRoot, file)} imports ${hook}`);
    });

    expect(violations).toEqual([]);
  });
});
