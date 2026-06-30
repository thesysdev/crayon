"use client";

import svgPaths from "@/imports/svg-urruvoh2be";
import { Stack } from "@phosphor-icons/react";
import { useEffect, useRef, type ReactNode } from "react";
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

const MARQUEE_COPIES = 3;
const MARQUEE_SPEED = 0.2;

function createMoreChip(): StackChipItem {
  return {
    name: "+ more",
    iconKind: "more",
    badgeClassName: stackChipStyles.badgeMore,
    isBlurred: true,
  };
}

const STACK_ROWS: StackRow[] = [
  {
    label: "All LLMs",
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
    label: "Any UI Library",
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
  {
    label: "Any Framework",
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
];

export function CompatibilitySection({
  title,
  description,
  embedded = false,
}: { title?: ReactNode; description?: ReactNode; embedded?: boolean } = {}) {
  const trackRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const tracks = trackRefs.current.filter(
      (track): track is HTMLDivElement => track !== null,
    );
    if (tracks.length === 0) return;

    let frameId = 0;
    const offsets = tracks.map(() => 0);
    const initialized = tracks.map(() => false);

    const tick = () => {
      tracks.forEach((track, i) => {
        const loopWidth = track.scrollWidth / MARQUEE_COPIES;
        if (loopWidth > 0) {
          // Alternate direction: even rows scroll right-to-left, odd rows left-to-right.
          const direction = i % 2 === 0 ? -1 : 1;
          if (!initialized[i]) {
            offsets[i] = direction > 0 ? -loopWidth : 0;
            initialized[i] = true;
          }
          offsets[i] += MARQUEE_SPEED * direction;
          if (offsets[i] <= -loopWidth) {
            offsets[i] += loopWidth;
          } else if (offsets[i] >= 0) {
            offsets[i] -= loopWidth;
          }
          track.style.transform = `translateX(${offsets[i]}px)`;
        }
      });
      frameId = window.requestAnimationFrame(tick);
    };

    frameId = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(frameId);
      tracks.forEach((track) => {
        track.style.transform = "";
      });
    };
  }, []);

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
                    <span className={styles.titleAccent}>Any LLM, UI library, and framework.</span>
                  </>
                )}
              </h2>
              {description && <p className={styles.description}>{description}</p>}
            </div>
          </header>

          <div className={styles.rows}>
            {STACK_ROWS.map((row, rowIndex) => {
              const visibleItems = row.items.filter((item) => !item.isBlurred);
              const loopedItems = Array.from({ length: MARQUEE_COPIES }, (_, copyIndex) =>
                visibleItems.map((item, itemIndex) => ({
                  item,
                  key: `${row.label}-${itemIndex}-${copyIndex}`,
                })),
              ).flat();

              return (
                <div key={row.label} className={styles.row}>
                  <span className={styles.label}>{row.label}</span>
                  <div className={styles.chipsViewport}>
                    <div
                      ref={(el) => {
                        trackRefs.current[rowIndex] = el;
                      }}
                      className={styles.chips}
                    >
                      {loopedItems.map(({ item, key }) => (
                        <StackChip key={key} item={item} dense={embedded} />
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
