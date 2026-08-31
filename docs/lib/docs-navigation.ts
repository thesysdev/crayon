import type * as PageTree from "fumadocs-core/page-tree";

export type NestedDocsRoot = "openui-lang" | "agent" | "openui-cloud" | "api-reference";

export type SidebarMode =
  | { kind: "global" }
  | {
      kind: "nested";
      root: NestedDocsRoot;
    };

type NestedSection = {
  title: string;
  entryUrl: string;
  pathPrefix: string;
};

export const NESTED_DOCS_SECTIONS: Record<NestedDocsRoot, NestedSection> = {
  "openui-lang": {
    title: "OpenUI Lang",
    entryUrl: "/docs/openui-lang",
    pathPrefix: "/docs/openui-lang",
  },
  agent: {
    title: "Build Agents",
    entryUrl: "/docs/agent/getting-started/introduction",
    pathPrefix: "/docs/agent",
  },
  "openui-cloud": {
    title: "OpenUI Cloud",
    entryUrl: "/docs/openui-cloud",
    pathPrefix: "/docs/openui-cloud",
  },
  "api-reference": {
    title: "API Reference",
    entryUrl: "/docs/api-reference",
    pathPrefix: "/docs/api-reference",
  },
};

const promotedGlobalUrls = new Set([
  "/docs",
  "/docs/openui-lang/quickstart",
  "/docs/openui-lang/comparison",
]);

export const GLOBAL_DOCS_TREE: PageTree.Root = {
  type: "root",
  $id: "docs:global",
  name: "OpenUI",
  children: [
    { type: "separator", name: "Start" },
    { type: "page", name: "Overview", url: "/docs" },
    {
      type: "page",
      name: "Build your first UI",
      url: "/docs/openui-lang/quickstart",
    },
    {
      type: "page",
      name: "Feature Comparison",
      url: "/docs/openui-lang/comparison",
    },
    { type: "separator", name: "Build" },
    {
      type: "page",
      name: NESTED_DOCS_SECTIONS["openui-lang"].title,
      url: NESTED_DOCS_SECTIONS["openui-lang"].entryUrl,
    },
    {
      type: "page",
      name: NESTED_DOCS_SECTIONS.agent.title,
      url: NESTED_DOCS_SECTIONS.agent.entryUrl,
    },
    { type: "separator", name: "Production" },
    {
      type: "page",
      name: NESTED_DOCS_SECTIONS["openui-cloud"].title,
      url: NESTED_DOCS_SECTIONS["openui-cloud"].entryUrl,
    },
    { type: "separator", name: "Reference" },
    {
      type: "page",
      name: NESTED_DOCS_SECTIONS["api-reference"].title,
      url: NESTED_DOCS_SECTIONS["api-reference"].entryUrl,
    },
  ],
};

function isPathWithin(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function getNestedRootForEntryUrl(url: string): NestedDocsRoot | undefined {
  return (Object.entries(NESTED_DOCS_SECTIONS) as [NestedDocsRoot, NestedSection][]).find(
    ([, section]) => section.entryUrl === url,
  )?.[0];
}

export function getNestedRootForPathname(pathname: string): NestedDocsRoot | undefined {
  return (Object.entries(NESTED_DOCS_SECTIONS) as [NestedDocsRoot, NestedSection][]).find(
    ([, section]) => isPathWithin(pathname, section.pathPrefix),
  )?.[0];
}

export function getDefaultSidebarMode(pathname: string): SidebarMode {
  if (pathname === "/docs" || pathname === "/docs/overview") return { kind: "global" };

  const root = getNestedRootForPathname(pathname);
  return root ? { kind: "nested", root } : { kind: "global" };
}

export function getGlobalActiveItemUrl(pathname: string): string | undefined {
  if (promotedGlobalUrls.has(pathname)) return pathname;

  const root = getNestedRootForPathname(pathname);
  return root ? NESTED_DOCS_SECTIONS[root].entryUrl : undefined;
}

function findNestedFolder(
  nodes: PageTree.Node[],
  root: NestedDocsRoot,
): PageTree.Folder | undefined {
  for (const node of nodes) {
    if (node.type !== "folder") continue;
    if (node.root && node.$ref?.folder === root) return node;

    const nested = findNestedFolder(node.children, root);
    if (nested) return nested;
  }

  return undefined;
}

export function getNestedDocsTree(tree: PageTree.Root, root: NestedDocsRoot): PageTree.Root {
  const folder = findNestedFolder(tree.children, root);
  if (!folder) throw new Error(`Nested docs root "${root}" was not found in the page tree.`);

  return {
    type: "root",
    $id: `docs:nested:${root}`,
    name: folder.name,
    children: folder.children,
  };
}
