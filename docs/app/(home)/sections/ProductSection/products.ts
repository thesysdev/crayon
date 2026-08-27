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

/* The three product bands, in the order the page tells them: what OpenUI is,
   then the two hosted things built on it.
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
 * HREFS: Gateway has no docs of its own yet, so its link points at the nearest
 * real destination. Repoint it when Gateway ships. */

export const LANG_PRODUCT: ProductSectionProps = {
  name: "OpenUI Lang",
  tag: "Open Source",
  headline: "Open-source language and runtime for Generative UI.",
  description: "Make your AI agents stream live charts, forms, cards, tables, and dashboards.",
  secondaryCta: { label: "View docs", href: "/docs/openui-lang" },
  tone: "light",
  cards: [
    {
      Icon: CursorClick,
      title: "Interactive",
      description: "Reactive state, inputs, and actions wired straight to your tools.",
    },
    {
      Icon: Palette,
      title: "Bring your UI library",
      description: "Use your own components, styles, tokens, and interactions.",
    },
    {
      Icon: ShieldCheck,
      title: "Safe by default",
      description: "The model composes your components, never arbitrary code.",
    },
    {
      Icon: Lightning,
      title: "Stream UI live",
      description: "Render interfaces progressively as the model responds in real time.",
    },
  ],
};

export const GATEWAY_PRODUCT: ProductSectionProps = {
  name: "OpenUI Gateway",
  headline: "Reliability layer for Generative UI.",
  description:
    "Route model requests through a gateway built to catch broken outputs, recover failures, and keep generated UI working in production.",
  secondaryCta: { label: "View docs", href: "/docs/agent/getting-started/openui-cloud" },
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
