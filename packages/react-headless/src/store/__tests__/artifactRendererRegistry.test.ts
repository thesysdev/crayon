import { describe, expect, it, vi } from "vitest";
import {
  buildArtifactRendererRegistry,
  lookupArtifactRenderer,
  lookupArtifactRendererByType,
} from "../ArtifactRenderersContext";
import { defineArtifactRenderer } from "../artifactRendererTypes";

const makeRenderer = (type: string, toolName: string | string[]) =>
  defineArtifactRenderer({
    type,
    toolName,
    parser: () => ({ props: {}, meta: null }),
    preview: () => null,
    actual: () => null,
  });

describe("buildArtifactRendererRegistry", () => {
  it("indexes a single toolName", () => {
    const r = makeRenderer("th_presentation", "presentation:create");
    const registry = buildArtifactRendererRegistry([r]);
    expect(registry.byToolName.get("presentation:create")).toBe(r);
  });

  it("indexes every name of a toolName array under the same renderer", () => {
    const r = makeRenderer("th_presentation", ["presentation:create", "presentation:edit"]);
    const registry = buildArtifactRendererRegistry([r]);
    expect(registry.byToolName.get("presentation:create")).toBe(r);
    expect(registry.byToolName.get("presentation:edit")).toBe(r);
  });

  it("indexes by type", () => {
    const r = makeRenderer("th_dashboard", "dashboard:create");
    const registry = buildArtifactRendererRegistry([r]);
    expect(registry.byType.get("th_dashboard")).toBe(r);
  });

  it("first-wins on duplicate toolName with dev warning", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const first = makeRenderer("a", "tool:x");
    const second = makeRenderer("b", "tool:x");
    const registry = buildArtifactRendererRegistry([first, second]);
    expect(registry.byToolName.get("tool:x")).toBe(first);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('toolName "tool:x"'));
    warn.mockRestore();
  });

  it("first-wins on duplicate type with dev warning", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const first = makeRenderer("th_report", "report:create");
    const second = makeRenderer("th_report", "report:edit");
    const registry = buildArtifactRendererRegistry([first, second]);
    expect(registry.byType.get("th_report")).toBe(first);
    // second's toolName still registers (different name), only type lookup is deduped
    expect(registry.byToolName.get("report:edit")).toBe(second);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('type "th_report"'));
    warn.mockRestore();
  });
});

describe("lookupArtifactRenderer", () => {
  it("resolves by toolName and returns null on miss", () => {
    const r = makeRenderer("th_presentation", ["p:create", "p:edit"]);
    const registry = buildArtifactRendererRegistry([r]);
    expect(lookupArtifactRenderer(registry, "p:edit")).toBe(r);
    expect(lookupArtifactRenderer(registry, "unknown")).toBeNull();
  });
});

describe("lookupArtifactRendererByType", () => {
  it("resolves by type and returns null on miss", () => {
    const r = makeRenderer("th_dashboard", "d:create");
    const registry = buildArtifactRendererRegistry([r]);
    expect(lookupArtifactRendererByType(registry, "th_dashboard")).toBe(r);
    expect(lookupArtifactRendererByType(registry, "th_other")).toBeNull();
  });
});
