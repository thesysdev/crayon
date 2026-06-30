import { describe, expect, it } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { mirrorStylesWithLayer, wrapInLayer, writeLayeredCopy } from "./css-layer-utils.mjs";

describe("wrapInLayer", () => {
  it("wraps plain css in @layer openui", () => {
    expect(wrapInLayer(".a{color:red}")).toBe("@layer openui{.a{color:red}}");
  });

  it("strips a leading BOM before wrapping so the first rule stays valid", () => {
    // U+FEFF inside a layer block parses as an identifier and kills the
    // first rule (e.g. the :root theme tokens) — the 2026-06 BOM incident.
    expect(wrapInLayer("\uFEFF:root{--x:1}")).toBe("@layer openui{:root{--x:1}}");
  });

  it("is idempotent", () => {
    const once = wrapInLayer(".a{color:red}");
    expect(wrapInLayer(once)).toBe(once);
  });

  it("leaves empty/whitespace-only content untouched", () => {
    expect(wrapInLayer("")).toBe("");
    expect(wrapInLayer("  \n")).toBe("  \n");
  });
});

describe("writeLayeredCopy", () => {
  it("writes a wrapped copy, creating parent directories", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "css-layer-"));
    const src = path.join(dir, "in.css");
    const dest = path.join(dir, "nested", "out.css");
    fs.writeFileSync(src, ".a{color:red}");
    writeLayeredCopy(src, dest);
    expect(fs.readFileSync(dest, "utf8")).toBe("@layer openui{.a{color:red}}");
  });
});

describe("mirrorStylesWithLayer", () => {
  it("wraps css files, copies unwrapped names verbatim, skips non-css", () => {
    const src = fs.mkdtempSync(path.join(os.tmpdir(), "css-layer-src-"));
    const dest = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "css-layer-dest-")), "layered");
    fs.writeFileSync(path.join(src, "button.css"), ".b{color:red}");
    fs.writeFileSync(path.join(src, "openui-defaults.css"), ":root{--x:1}");
    fs.writeFileSync(path.join(src, "cssUtils.scss"), "$x: 1;");
    mirrorStylesWithLayer(src, dest);
    expect(fs.readFileSync(path.join(dest, "button.css"), "utf8")).toBe("@layer openui{.b{color:red}}");
    expect(fs.readFileSync(path.join(dest, "openui-defaults.css"), "utf8")).toBe(":root{--x:1}");
    expect(fs.existsSync(path.join(dest, "cssUtils.scss"))).toBe(false);
  });
});
