import { FakeVisual } from "@/components/fake-visual";
import { Mermaid } from "@/components/mermaid";
import { TweetEmbed } from "@/components/tweet-embed";
import * as TabsComponents from "fumadocs-ui/components/tabs";
import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    ...TabsComponents,
    TweetEmbed,
    FakeVisual,
    Mermaid,
    ...components,
  };
}
