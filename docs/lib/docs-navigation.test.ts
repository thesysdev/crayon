import type * as PageTree from "fumadocs-core/page-tree";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  GLOBAL_DOCS_TREE,
  getDefaultSidebarMode,
  getGlobalActiveItemUrl,
  getNestedDocsTree,
  getNestedRootForEntryUrl,
  getNestedRootForPathname,
} from "./docs-navigation";

describe("global docs navigation", () => {
  it("exposes the agreed information architecture", () => {
    const entries = GLOBAL_DOCS_TREE.children.map((node) => ({
      type: node.type,
      name: node.name,
      url: node.type === "page" ? node.url : undefined,
    }));

    assert.deepEqual(entries, [
      { type: "separator", name: "Overview", url: undefined },
      { type: "page", name: "Introduction", url: "/docs" },
      { type: "page", name: "What is Generative UI", url: "/docs/generative-ui" },
      {
        type: "page",
        name: "Feature Comparison",
        url: "/docs/openui-lang/comparison",
      },
      { type: "separator", name: "Build", url: undefined },
      { type: "page", name: "OpenUI Lang", url: "/docs/openui-lang" },
      {
        type: "page",
        name: "Build Agents",
        url: "/docs/agent",
      },
      { type: "separator", name: "Production", url: undefined },
      { type: "page", name: "Gateway", url: "/docs/gateway" },
      { type: "page", name: "Observability", url: "/docs/observability" },
      { type: "separator", name: "Reference", url: undefined },
      { type: "page", name: "API Reference", url: "/docs/api-reference" },
    ]);
  });

  it("treats nested roots as navigation sections rather than products", () => {
    assert.equal(getNestedRootForEntryUrl("/docs/openui-lang"), "openui-lang");
    assert.equal(getNestedRootForEntryUrl("/docs/agent"), "agent");
    assert.equal(getNestedRootForEntryUrl("/docs/gateway"), "gateway");
    assert.equal(getNestedRootForEntryUrl("/docs/observability"), "observability");
    assert.equal(getNestedRootForEntryUrl("/docs/api-reference"), "api-reference");
    assert.equal(getNestedRootForEntryUrl("/docs/openui-lang/quickstart"), undefined);
  });

  it("uses a nested sidebar for direct links into a nested section", () => {
    assert.deepEqual(getDefaultSidebarMode("/docs"), { kind: "global" });
    assert.deepEqual(getDefaultSidebarMode("/docs/overview"), { kind: "global" });
    assert.deepEqual(getDefaultSidebarMode("/docs/generative-ui"), { kind: "global" });
    assert.deepEqual(getDefaultSidebarMode("/docs/openui-lang/comparison"), { kind: "global" });
    assert.deepEqual(getDefaultSidebarMode("/docs/openui-lang/quickstart"), {
      kind: "nested",
      root: "openui-lang",
    });
    assert.deepEqual(getDefaultSidebarMode("/docs/api-reference/cli"), {
      kind: "nested",
      root: "api-reference",
    });
    assert.deepEqual(getDefaultSidebarMode("/docs/gateway/reliability/error-correction"), {
      kind: "nested",
      root: "gateway",
    });
    assert.deepEqual(getDefaultSidebarMode("/docs/observability/production-setup"), {
      kind: "nested",
      root: "observability",
    });
    assert.deepEqual(getDefaultSidebarMode("/docs/mcp"), { kind: "global" });
  });

  it("promotes overview pages while grouping product pages under their roots", () => {
    assert.equal(getGlobalActiveItemUrl("/docs/generative-ui"), "/docs/generative-ui");
    assert.equal(
      getGlobalActiveItemUrl("/docs/openui-lang/comparison"),
      "/docs/openui-lang/comparison",
    );
    assert.equal(getGlobalActiveItemUrl("/docs/openui-lang/quickstart"), "/docs/openui-lang");
    assert.equal(getGlobalActiveItemUrl("/docs/openui-lang/renderer"), "/docs/openui-lang");
    assert.equal(getGlobalActiveItemUrl("/docs/gateway/api/responses"), "/docs/gateway");
    assert.equal(
      getGlobalActiveItemUrl("/docs/observability/console-dashboards"),
      "/docs/observability",
    );
  });
});

describe("nested docs navigation", () => {
  const fullTree: PageTree.Root = {
    name: "OpenUI",
    children: [
      {
        type: "folder",
        name: "OpenUI Lang",
        root: true,
        $ref: { folder: "openui-lang" },
        children: [
          { type: "page", name: "Introduction", url: "/docs/openui-lang" },
          { type: "page", name: "Quick Start", url: "/docs/openui-lang/quickstart" },
        ],
      },
      {
        type: "folder",
        name: "API Reference",
        root: true,
        $ref: { folder: "api-reference" },
        children: [{ type: "page", name: "Overview", url: "/docs/api-reference" }],
      },
    ],
  };

  it("extracts a maintained nested tree from the Fumadocs tree", () => {
    assert.deepEqual(getNestedDocsTree(fullTree, "openui-lang"), {
      type: "root",
      $id: "docs:nested:openui-lang",
      name: "OpenUI Lang",
      children: [
        { type: "page", name: "Introduction", url: "/docs/openui-lang" },
        { type: "page", name: "Quick Start", url: "/docs/openui-lang/quickstart" },
      ],
    });
  });

  it("maps any page within a nested section to its root", () => {
    assert.equal(getNestedRootForPathname("/docs/openui-lang/renderer"), "openui-lang");
    assert.equal(getNestedRootForPathname("/docs/api-reference"), "api-reference");
    assert.equal(getNestedRootForPathname("/docs"), undefined);
  });

  it("fails clearly when the requested nested root is absent", () => {
    assert.throws(
      () => getNestedDocsTree(fullTree, "gateway"),
      /Nested docs root "gateway" was not found/,
    );
  });
});
