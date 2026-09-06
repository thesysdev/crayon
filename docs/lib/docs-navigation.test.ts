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
      children: undefined,
    }));

    assert.deepEqual(entries, [
      { type: "separator", name: "Overview", url: undefined, children: undefined },
      { type: "page", name: "Introduction", url: "/docs", children: undefined },
      {
        type: "page",
        name: "How OpenUI works",
        url: "/docs/architecture",
        children: undefined,
      },
      {
        type: "page",
        name: "OpenUI vs others",
        url: "/docs/openui-lang/comparison",
        children: undefined,
      },
      { type: "separator", name: "Build", url: undefined, children: undefined },
      {
        type: "page",
        name: "OpenUI Lang",
        url: "/docs/openui-lang",
        children: undefined,
      },
      {
        type: "page",
        name: "Agent Interface",
        url: "/docs/agent/agent-interface/getting-started/introduction",
        children: undefined,
      },
      {
        type: "page",
        name: "Integrations",
        url: "/docs/integrations",
        children: undefined,
      },
      { type: "separator", name: "Production", url: undefined, children: undefined },
      { type: "page", name: "Gateway", url: "/docs/gateway", children: undefined },
      {
        type: "page",
        name: "Observability",
        url: "/docs/observability",
        children: undefined,
      },
      { type: "separator", name: "Reference", url: undefined, children: undefined },
      {
        type: "page",
        name: "API Reference",
        url: "/docs/api-reference",
        children: undefined,
      },
    ]);
  });

  it("treats nested roots as navigation sections rather than products", () => {
    assert.equal(getNestedRootForEntryUrl("/docs/openui-lang"), "openui-lang");
    assert.equal(
      getNestedRootForEntryUrl("/docs/agent/agent-interface/getting-started/introduction"),
      "agent-interface",
    );
    assert.equal(getNestedRootForEntryUrl("/docs/integrations"), "integrations");
    assert.equal(getNestedRootForEntryUrl("/docs/gateway"), "gateway");
    assert.equal(getNestedRootForEntryUrl("/docs/observability"), "observability");
    assert.equal(getNestedRootForEntryUrl("/docs/api-reference"), "api-reference");
    assert.equal(getNestedRootForEntryUrl("/docs/openui-lang/quickstart"), undefined);
  });

  it("uses a nested sidebar for direct links into a nested section", () => {
    assert.deepEqual(getDefaultSidebarMode("/docs"), { kind: "global" });
    assert.deepEqual(getDefaultSidebarMode("/docs/overview"), { kind: "global" });
    assert.deepEqual(getDefaultSidebarMode("/docs/openui-lang/comparison"), { kind: "global" });
    assert.deepEqual(getDefaultSidebarMode("/docs/openui-lang/quickstart"), {
      kind: "nested",
      root: "openui-lang",
    });
    assert.deepEqual(
      getDefaultSidebarMode("/docs/agent/agent-interface/core-concepts/tools"),
      { kind: "nested", root: "agent-interface" },
    );
    assert.deepEqual(getDefaultSidebarMode("/docs/integrations/assistant-ui"), {
      kind: "nested",
      root: "integrations",
    });
    assert.deepEqual(getDefaultSidebarMode("/docs/api-reference/cli"), {
      kind: "nested",
      root: "api-reference",
    });
    assert.deepEqual(getDefaultSidebarMode("/docs/gateway/reliability/error-correction"), {
      kind: "nested",
      root: "gateway",
    });
    assert.deepEqual(getDefaultSidebarMode("/docs/observability/installation"), {
      kind: "nested",
      root: "observability",
    });
    assert.deepEqual(getDefaultSidebarMode("/docs/mcp"), { kind: "global" });
  });

  it("promotes overview pages while grouping product pages under their roots", () => {
    assert.equal(
      getGlobalActiveItemUrl("/docs/openui-lang/comparison"),
      "/docs/openui-lang/comparison",
    );
    assert.equal(getGlobalActiveItemUrl("/docs/openui-lang/quickstart"), "/docs/openui-lang");
    assert.equal(getGlobalActiveItemUrl("/docs/openui-lang/renderer"), "/docs/openui-lang");
    assert.equal(
      getGlobalActiveItemUrl("/docs/agent/agent-interface/core-concepts/tools"),
      "/docs/agent/agent-interface/getting-started/introduction",
    );
    assert.equal(getGlobalActiveItemUrl("/docs/integrations/copilotkit"), "/docs/integrations");
    assert.equal(getGlobalActiveItemUrl("/docs/gateway/api/responses"), "/docs/gateway");
    assert.equal(
      getGlobalActiveItemUrl("/docs/observability/dashboard"),
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
      {
        type: "folder",
        name: "Agent Interface",
        $ref: { folder: "agent/agent-interface" },
        children: [
          {
            type: "page",
            name: "Introduction",
            url: "/docs/agent/agent-interface/getting-started/introduction",
          },
        ],
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
    assert.equal(
      getNestedRootForPathname("/docs/agent/agent-interface/customize/sidebar"),
      "agent-interface",
    );
    assert.equal(getNestedRootForPathname("/docs/integrations/langchain"), "integrations");
    assert.equal(getNestedRootForPathname("/docs"), undefined);
  });

  it("fails clearly when the requested nested root is absent", () => {
    assert.throws(
      () => getNestedDocsTree(fullTree, "gateway"),
      /Nested docs root "gateway" was not found/,
    );
  });
});
