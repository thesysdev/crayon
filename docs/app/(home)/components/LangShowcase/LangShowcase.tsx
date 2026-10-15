"use client";

import { SITE_NAV_LINKS } from "@/lib/site-nav-links";
import { ArrowUpRight } from "@phosphor-icons/react";
import Image from "next/image";
import { useState } from "react";
import { BevelButton } from "../Button/BevelButton";
import { FadedDither } from "../FadedDither/FadedDither";
import styles from "./LangShowcase.module.css";

/* The "framework for agent-driven interfaces" showcase: three agents as
   parallel panels, one open at a time. Each sits on the stages' Faded Dither,
   lightly tinted (from its Shiro; F1 from its answer's teal), and the open one shows the agent's
   answer on a white card. A panel without a recording yet shows an empty card.
   (The earlier live-HTML answers are parked in _saved/lang-showcase-live.) */

type Agent = {
  id: string;
  label: string;
  /* A Shiro mascot under /public, drawn as supplied: never recoloured. */
  mascot: string;
  mascotAlt: string;
  /* Where "View demo" goes: the live demo this agent's answer comes from. */
  demo: string;
  answer?: { src: string; alt: string; width: number; height: number };
};

const AGENTS: Agent[] = [
  {
    id: "ikea",
    label: "Ikea",
    mascot: "/homepage/shiro/shiro-woodworker.svg",
    mascotAlt: "Shiro the woodworker",
    demo: SITE_NAV_LINKS.openIntelligentUi.href,
    answer: {
      src: "/homepage/agents/ikea-kallax.gif",
      alt: "The Ikea agent's answer streaming in: a step-by-step KALLAX guide with an exploded drawing of the shelf, a view toggle and a slider to separate the parts.",
      width: 1100,
      height: 1200,
    },
  },
  {
    id: "f1",
    label: "F1",
    mascot: "/homepage/shiro/shiro-f1.svg",
    mascotAlt: "Shiro in a racing helmet",
    demo: SITE_NAV_LINKS.f1Dashboard.href,
    answer: {
      src: "/homepage/agents/f1-answer.gif",
      alt: "The F1 agent's answer: Antonelli against Russell on points, wins and podiums, the Mercedes drivers' standings, and follow-up questions.",
      width: 1100,
      height: 1183,
    },
  },
  {
    id: "travel",
    label: "Travel",
    mascot: "/homepage/shiro/shiro-travel.svg",
    mascotAlt: "Shiro in a bucket hat",
    demo: SITE_NAV_LINKS.tripPlanner.href,
    answer: {
      src: "/homepage/agents/travel-answer.png",
      alt: "The Travel agent's answer: four slow days in Kyoto in November, with Eikan-dō, Philosopher's Walk and Arashiyama, and three November date windows to pick from.",
      width: 1400,
      height: 2040,
    },
  },
];

export function LangShowcase() {
  const [open, setOpen] = useState("f1");

  return (
    <div className={styles.showcase}>
      {AGENTS.map((agent) => {
        const isOpen = open === agent.id;
        return (
          <section
            key={agent.id}
            className={`${styles.panel} ${isOpen ? styles.panelOpen : ""}`.trim()}
            data-agent={agent.id}
          >
            <FadedDither band="light" className={styles.dither} />
            <span className={styles.tint} aria-hidden="true" />

            <div className={styles.headRow}>
              <button
                type="button"
                className={styles.head}
                aria-expanded={isOpen}
                aria-controls={`agent-${agent.id}`}
                onClick={() => setOpen(agent.id)}
              >
                <Image
                  className={styles.mascot}
                  src={agent.mascot}
                  alt={agent.mascotAlt}
                  width={64}
                  height={64}
                  unoptimized
                />
                <span className={styles.label}>{agent.label}</span>
              </button>
            </div>

            <div id={`agent-${agent.id}`} className={styles.card} aria-hidden={!isOpen}>
              {agent.answer && (
                <div className={styles.answerClip}>
                  <Image
                    className={styles.answer}
                    src={agent.answer.src}
                    alt={agent.answer.alt}
                    width={agent.answer.width}
                    height={agent.answer.height}
                    sizes="(max-width: 767px) 80vw, 720px"
                    /* A recording plays only as the original file. */
                    unoptimized={agent.answer.src.endsWith(".gif")}
                  />
                </div>
              )}
            </div>
            {isOpen && (
              <div className={styles.demo}>
                <BevelButton
                  variant="secondary"
                  href={agent.demo}
                  label="View demo"
                  external
                  badge={<ArrowUpRight size={16} weight="bold" />}
                />
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
