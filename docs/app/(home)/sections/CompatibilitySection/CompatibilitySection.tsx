"use client";

import svgPaths from "@/imports/svg-urruvoh2be";
import { Stack } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import {
  StackChip,
  stackChipStyles,
  type StackChipItem,
} from "../../components/StackChip/StackChip";
import styles from "./CompatibilitySection.module.css";

interface StackRow {
  label: string;
  items: StackChipItem[];
}

function createMoreChip(): StackChipItem {
  return {
    name: "+ more",
    iconKind: "more",
    badgeClassName: stackChipStyles.badgeMore,
    isBlurred: true,
  };
}

/* Three rows, and the labels are the claim: any model, any backend, any place it
   renders. UI libraries and render targets share the third row because a reader
   asking "will this work where I work?" is asking one question, not two. */
const STACK_ROWS: StackRow[] = [
  {
    label: "Any LLM",
    items: [
      {
        name: "OpenAI",
        iconKind: "image",
        localSrc: "/brand-icons/openai.svg",
        iconColor: "000000",
        badgeClassName: `${stackChipStyles.badgeWhite} ${stackChipStyles.badgeWithBorder}`,
      },
      {
        name: "Anthropic",
        iconKind: "image",
        slug: "anthropic",
        iconColor: "ffffff",
        badgeClassName: stackChipStyles.badgeAnthropic,
      },
      {
        name: "Gemini",
        iconKind: "image",
        slug: "googlegemini",
        iconColor: "000000",
        badgeClassName: `${stackChipStyles.badgeWhite} ${stackChipStyles.badgeWithBorder}`,
      },
      {
        name: "Mistral",
        iconKind: "image",
        slug: "mistralai",
        iconColor: "ffffff",
        badgeClassName: stackChipStyles.badgeMistral,
      },
      {
        name: "xAI",
        iconKind: "image",
        localSrc: "/brand-icons/xai.svg",
        iconColor: "ffffff",
        badgeClassName: stackChipStyles.badgeBlack,
      },
      {
        name: "DeepSeek",
        iconKind: "image",
        localSrc: "/brand-icons/deepseek.svg",
        iconColor: "ffffff",
        badgeClassName: stackChipStyles.badgeDeepSeek,
      },
      createMoreChip(),
    ],
  },
  {
    label: "Any backend framework",
    items: [
      {
        name: "Vercel AI SDK",
        iconKind: "image",
        slug: "vercel",
        iconColor: "ffffff",
        badgeClassName: stackChipStyles.badgeBlack,
      },
      {
        name: "LangChain",
        iconKind: "image",
        slug: "langchain",
        iconColor: "ffffff",
        badgeClassName: stackChipStyles.badgeLangChain,
      },
      {
        name: "CrewAI",
        iconKind: "image",
        slug: "crewai",
        iconColor: "ffffff",
        badgeClassName: stackChipStyles.badgeCrewAi,
      },
      {
        name: "OpenAI Agents SDK",
        iconKind: "image",
        localSrc: "/brand-icons/openai.svg",
        iconColor: "000000",
        badgeClassName: `${stackChipStyles.badgeWhite} ${stackChipStyles.badgeWithBorder}`,
      },
      {
        name: "Anthropic Agents SDK",
        iconKind: "image",
        slug: "anthropic",
        iconColor: "ffffff",
        badgeClassName: stackChipStyles.badgeAnthropic,
      },
      createMoreChip(),
    ],
  },
  {
    /* Where it renders. Every entry is a package we publish (react-lang,
       vue-lang, svelte-lang, react-email) or a listed integration — no Flutter
       and no direct native, which A2UI has and we do not. */
    label: "Any client",
    items: [
      {
        name: "React",
        iconKind: "image",
        slug: "react",
        iconColor: "000000",
        badgeClassName: `${stackChipStyles.badgeWhite} ${stackChipStyles.badgeWithBorder}`,
      },
      {
        name: "Vue",
        iconKind: "image",
        slug: "vuedotjs",
        iconColor: "ffffff",
        badgeClassName: stackChipStyles.badgeBlack,
      },
      {
        name: "Svelte",
        iconKind: "image",
        slug: "svelte",
        iconColor: "ffffff",
        badgeClassName: stackChipStyles.badgeBlack,
      },
      {
        name: "React Native",
        iconKind: "image",
        slug: "react",
        iconColor: "000000",
        badgeClassName: `${stackChipStyles.badgeWhite} ${stackChipStyles.badgeWithBorder}`,
      },
      {
        name: "Lynx",
        iconKind: "image",
        localSrc: "/integration-logos/lynx.svg",
        iconColor: "ffffff",
        badgeClassName: `${stackChipStyles.badgeWhite} ${stackChipStyles.badgeWithBorder}`,
      },
      {
        name: "Email",
        iconKind: "text",
        iconText: "@",
        badgeClassName: stackChipStyles.badgeBlack,
      },
      createMoreChip(),
    ],
  },
  {
    label: "Any design library",
    items: [
      {
        name: "OpenUI Design system",
        iconKind: "mascot",
        badgeClassName: stackChipStyles.badgeOpenUi,
      },
      {
        name: "ShadCN",
        iconKind: "vector",
        badgeClassName: stackChipStyles.badgeBlack,
        iconViewBox: "0 0 24 24",
        iconPath: svgPaths.p46a4800,
        iconFill: "white",
        clipId: "clip_shadcn",
        clipSize: "24",
      },
      {
        name: "Material Design system",
        iconKind: "vector",
        badgeClassName: stackChipStyles.badgeMaterial,
        iconViewBox: "0 0 30 30",
        iconPath: svgPaths.p3a7bdd80,
        iconFill: "white",
        clipId: "clip_material",
        clipSize: "30",
      },
      {
        name: "DaisyUI",
        iconKind: "text",
        iconText: "D",
        badgeClassName: stackChipStyles.badgeDaisyUi,
      },
      {
        name: "Base UI",
        iconKind: "text",
        iconText: "B",
        badgeClassName: stackChipStyles.badgeBaseUi,
      },
      createMoreChip(),
    ],
  },
];

export function CompatibilitySection({
  title,
  description,
  embedded = false,
}: { title?: ReactNode; description?: ReactNode; embedded?: boolean } = {}) {
  return (
    <section
      className={styles.section}
      data-variant={embedded ? "embedded" : undefined}
      aria-labelledby="favorite-stack-title"
    >
      <div className={styles.container}>
        <div className={styles.stack}>
          <header className={styles.header}>
            <span className={styles.titleIcon} aria-hidden="true">
              <Stack size={18} weight="light" />
            </span>
            <div className={styles.headerText}>
              <h2 id="favorite-stack-title" className={styles.title}>
                {title ?? (
                  <>
                    Works with your stack.
                    <br />
                    <span className={styles.titleAccent}>
                      Any LLM, backend, client, and design library.
                    </span>
                  </>
                )}
              </h2>
              {description && <p className={styles.description}>{description}</p>}
            </div>
          </header>

          {/* Static, not a marquee. The rows used to render three copies of
              every chip and slide them past a mask, which meant the names a
              reader wanted to check were always drifting away, each appeared
              three times in the DOM, and an agent reading the page saw the
              triplication rather than a list. Wrapping in place is plainer and
              says the same thing once. */}
          <div className={styles.rows}>
            {STACK_ROWS.map((row) => (
              <div key={row.label} className={styles.row}>
                <span className={styles.label}>{row.label}</span>
                <div className={styles.chips}>
                  {row.items.map((item) => (
                    <StackChip key={`${row.label}-${item.name}`} item={item} dense={embedded} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
