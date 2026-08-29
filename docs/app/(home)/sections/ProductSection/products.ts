import {
  ArrowsClockwise,
  ArrowsLeftRight,
  CursorClick,
  Key,
  Lightning,
  MagnifyingGlass,
  Palette,
  PlayCircle,
  ShieldCheck,
  WarningDiamond,
  Wrench,
} from "@phosphor-icons/react/dist/ssr";
import type { ProductSectionProps } from "./ProductSection";

/* The product bands, in the order the page tells them: what OpenUI is, then
   the hosted thing built on it.

   OBSERVABILITY_PRODUCT is still defined but no longer rendered: while it is in
   early access the home page gives it a line rather than a band. Its props are
   kept here so promoting it back is a one-line change in CloudSection.
 *
 * ARTWORK PENDING. None of the three has a `shot` yet, so each stage renders
 * empty, holding its space. Add the images to /public and set `shot` to their
 * basename (minus -light/-dark.webp); nothing else needs to change.
 *
 * What each visual should show:
 *   Lang          a prompt transforming into OpenUI Lang, then into a rich
 *                 interactive interface
 *   Gateway       code switching the OpenAI baseURL to OpenUI Gateway, the
 *                 request flowing through Route, Validate, Correct, Fallback,
 *                 Model
 *   Observability the OpenUI Console: a generated UI session on one side, its
 *                 events, interactions, errors and insights on the other
 *
 * NO TAG on Gateway or Observability: the eyebrow chip was tried as "Cloud"
 * and again as "Managed", and removed both times. Only Lang carries one.
 *
 * HREFS: Gateway points at its own page. Observability's still points at the
 * nearest real destination; repoint it if that band comes back. */

export const LANG_PRODUCT: ProductSectionProps = {
  /* "OpenUI", not "OpenUI Lang": the language/runtime split is a distinction the
     docs make and the marketing pages do not. The const keeps its name because
     it is internal. */
  name: "OpenUI",
  tag: "Open Source",
  /* Shaped like A2UI's lockup — a category line, then a sentence that says what
     it does and ends on the difference. "Open-source language and runtime"
     described the machinery rather than the payoff, and open source is table
     stakes here: A2UI and json-render are both Apache-licensed and neither
     mentions it. The difference worth naming is the one they share and we do
     not: they make the model write JSON. The numbers are the ones the benchmark
     header below already uses, so the band and the section under it cite the
     same comparison rather than two different ones. */
  headline: "A framework for agent-driven interfaces.",
  description:
    "Not just chat: agents stream live dashboards, forms, tables, and charts as complete interfaces. Up to 3\u00d7 faster and 67% more token efficient than JSON, at higher structural validity.",
  secondaryCta: { label: "View docs", href: "/docs/openui-lang" },
  tone: "light",
  /* No cards. Interactive, Bring your UI library, Safe by default and Stream UI
     live all moved to the feature grid directly below this band, which states
     them once alongside Live data and Cross-platform. */
  cards: [],
};

export const GATEWAY_PRODUCT: ProductSectionProps = {
  name: "OpenUI Gateway",
  headline: "Reliability layer for Generative UI.",
  description:
    "Route model requests through a gateway built to catch broken outputs, recover failures, and keep generated UI working in production.",
  primaryCta: {
    label: "Generate API key",
    href: "https://console.thesys.dev/keys",
    external: true,
  },
  secondaryCta: { label: "Learn more", href: "/cloud/gateway" },
  tone: "dark",
  cards: [
    {
      Icon: ArrowsLeftRight,
      title: "One API",
      description: "Use leading models through a single OpenAI-compatible endpoint.",
    },
    {
      Icon: Wrench,
      title: "Fix broken output",
      description: "Validate and correct malformed UI before it reaches users.",
    },
    {
      Icon: ArrowsClockwise,
      title: "Automatic fallbacks",
      description: "Recover from model and provider failures without breaking the experience.",
    },
    {
      Icon: Key,
      title: "Bring your keys",
      description: "Use your own provider keys or OpenUI-managed credits.",
    },
  ],
};

export const OBSERVABILITY_PRODUCT: ProductSectionProps = {
  name: "OpenUI Observability",
  headline: "Product analytics for Generative UI.",
  description:
    "See what your agent generated, what users experienced, and where your product needs to improve.",
  secondaryCta: { label: "View docs", href: "/docs/agent/getting-started/openui-cloud" },
  tone: "dark",
  cards: [
    {
      Icon: PlayCircle,
      title: "Replay sessions",
      description: "See the exact UI and interactions your users experienced.",
    },
    {
      Icon: WarningDiamond,
      title: "Track every failure",
      description: "Capture errors, corrections, fallbacks, and failed generations.",
    },
    {
      Icon: CursorClick,
      title: "Understand users",
      description: "See what people use, where they struggle, and what works.",
    },
    {
      Icon: MagnifyingGlass,
      title: "Find what\u2019s missing",
      description: "Surface unmet needs, emerging demand, and opportunities to improve.",
    },
  ],
};
