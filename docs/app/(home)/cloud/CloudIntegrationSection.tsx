"use client";

import { Button } from "@/components/button";
import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import { type CSSProperties, type KeyboardEvent, type ReactNode, useEffect, useState } from "react";
import { CloudCodeBlock } from "./CloudCodeBlock";
import styles from "./CloudIntegrationSection.module.css";

const CLIENT_EXAMPLE = `import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.THESYS_API_KEY,
  baseURL: "https://api.thesys.dev/v1/embed",
});`;

const CUSTOMERS = [
  {
    name: "Pointlabs",
    background: "/openui-cloud/pointlabs-bg.png",
    logo: "/openui-cloud/pointlabs-logo.png",
    logoWidth: 153,
    logoHeight: 40,
    description:
      "Pointlabs replaced A2UI with OpenUI Cloud to power a voice-first AI travel concierge",
    href: "https://www.thesys.dev/customers/point-labs",
  },
  {
    name: "Entelligence",
    background: "/openui-cloud/entelligence-bg.png",
    logo: "/openui-cloud/entelligence-logo.svg",
    logoWidth: 209,
    logoHeight: 40,
    description:
      "Using OpenUI Cloud to deliver engineering intelligence through AI-native Generative UI experiences.",
    href: "https://www.thesys.dev/customers/entelligence",
  },
  {
    name: "Wisdom AI",
    background: "/openui-cloud/wisdom-bg.png",
    logo: "/openui-cloud/wisdom-logo.svg",
    logoWidth: 168,
    logoHeight: 40,
    description:
      "Using OpenUI Cloud artifacts to create shareable reports with enterprise-ready business insights.",
    href: null,
  },
] as const;

export type CloudIntegrationStep = {
  title: string;
  description: string;
  href?: string;
  code?: string;
  highlightLines?: number[];
};

export function CloudIntegrationSetup({
  title,
  titleId,
  description,
  steps,
  code,
  codeLabel,
  action,
  highlightLines,
  titleSize = "default",
  autoAdvanceMs = 5000,
}: {
  title: ReactNode;
  titleId?: string;
  description?: ReactNode;
  steps: CloudIntegrationStep[];
  code: string;
  codeLabel: string;
  action?: { label: string; href: string };
  highlightLines?: number[];
  titleSize?: "default" | "medium";
  autoAdvanceMs?: number;
}) {
  const isInteractive = steps.some((step) => step.code);
  const [activeStep, setActiveStep] = useState(0);
  const [cycleReset, setCycleReset] = useState(0);
  const activeCode = steps[activeStep]?.code ?? code;
  const activeHighlightLines = steps[activeStep]?.highlightLines ?? highlightLines;
  const stepperStyle = {
    "--integration-step-duration": `${autoAdvanceMs}ms`,
  } as CSSProperties;

  useEffect(() => {
    if (!isInteractive || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timeout = window.setTimeout(() => {
      setActiveStep((current) => (current + 1) % steps.length);
    }, autoAdvanceMs);

    return () => window.clearTimeout(timeout);
  }, [activeStep, autoAdvanceMs, cycleReset, isInteractive, steps.length]);

  function selectStep(index: number) {
    setActiveStep(index);
    setCycleReset((current) => current + 1);
  }

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;

    event.preventDefault();
    const direction = event.key === "ArrowDown" ? 1 : -1;
    const nextIndex = (index + direction + steps.length) % steps.length;
    const tabs = event.currentTarget
      .closest('[role="tablist"]')
      ?.querySelectorAll<HTMLButtonElement>('[role="tab"]');

    selectStep(nextIndex);
    tabs?.[nextIndex]?.focus();
  }

  return (
    <div className={styles.inner}>
      <div className={styles.content}>
        <div className={styles.intro}>
          <h2 id={titleId} className={styles.title} data-size={titleSize}>
            {title}
          </h2>
          {description ? <p className={styles.description}>{description}</p> : null}
        </div>
        <ol
          className={styles.stepper}
          aria-label={codeLabel}
          role={isInteractive ? "tablist" : undefined}
          aria-orientation={isInteractive ? "vertical" : undefined}
          data-interactive={isInteractive ? "true" : undefined}
          data-step-count={isInteractive ? steps.length : undefined}
          style={isInteractive ? stepperStyle : undefined}
        >
          {steps.map((step, index) => (
            <li
              className={styles.step}
              data-active={isInteractive && activeStep === index ? "true" : undefined}
              data-complete={isInteractive && index < activeStep ? "true" : undefined}
              key={step.title}
            >
              {isInteractive ? (
                <button
                  className={styles.stepTab}
                  type="button"
                  role="tab"
                  id={`${titleId ?? "cloud-integration"}-tab-${index}`}
                  aria-selected={activeStep === index}
                  aria-controls={`${titleId ?? "cloud-integration"}-code`}
                  tabIndex={activeStep === index ? 0 : -1}
                  onClick={() => selectStep(index)}
                  onKeyDown={(event) => handleTabKeyDown(event, index)}
                >
                  <span className={styles.stepMarker}>{index + 1}</span>
                  <span className={styles.stepContent}>
                    <span className={styles.stepTitle}>{step.title}</span>
                    {activeStep === index ? (
                      <span className={styles.stepDescription}>{step.description}</span>
                    ) : null}
                  </span>
                </button>
              ) : (
                <>
                  <span className={styles.stepMarker}>{index + 1}</span>
                  <div className={styles.stepContent}>
                    {step.href ? (
                      <a
                        className={styles.stepLink}
                        href={step.href}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {step.title}
                        <ArrowUpRight size={16} strokeWidth={2} aria-hidden="true" />
                      </a>
                    ) : (
                      <span className={styles.stepTitle}>{step.title}</span>
                    )}
                    <p className={styles.stepDescription}>{step.description}</p>
                  </div>
                </>
              )}
            </li>
          ))}
        </ol>
        {action ? (
          <div className={styles.integrationAction}>
            <Button href={action.href} text={action.label} variant="tertiary" />
          </div>
        ) : null}
      </div>

      <div
        className={styles.codeColumn}
        id={`${titleId ?? "cloud-integration"}-code`}
        role={isInteractive ? "tabpanel" : undefined}
        aria-labelledby={
          isInteractive ? `${titleId ?? "cloud-integration"}-tab-${activeStep}` : undefined
        }
        aria-label={codeLabel}
      >
        <CloudCodeBlock
          key={isInteractive ? activeStep : "static"}
          code={activeCode}
          highlightLines={activeHighlightLines}
        />
      </div>
    </div>
  );
}

export function CloudIntegrationSection() {
  const steps: CloudIntegrationStep[] = [
    {
      title: "Generate an API Key",
      description: "Create a Cloud API key from the OpenUI console.",
      href: "https://console.thesys.dev/keys",
    },
    {
      title: "Update your base URL",
      description: "Point your OpenAI-compatible client to the OpenUI Cloud endpoint.",
    },
  ];

  return (
    <section className={styles.section} aria-labelledby="cloud-integration-title">
      <CloudIntegrationSetup
        title={
          <>
            Switch to OpenUI <span className={styles.cloudTag}>Cloud</span>
            <br />
            in seconds
          </>
        }
        titleId="cloud-integration-title"
        steps={steps}
        code={CLIENT_EXAMPLE}
        codeLabel="Upgrade to OpenUI Cloud"
      />

      <div className={styles.customers}>
        <h2 className={styles.customersTitle}>
          Real products &amp; workflows,{" "}
          <span className={styles.customersTitleSecondary}>
            built with OpenUI <span className={styles.cloudTag}>Cloud</span>
          </span>
        </h2>

        <div className={styles.customerGrid}>
          {CUSTOMERS.map((customer) => (
            <article key={customer.name} className={styles.customerCard}>
              <Image
                className={styles.customerBackground}
                src={customer.background}
                alt=""
                fill
                sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 400px"
              />
              <div className={styles.customerOverlay} aria-hidden="true" />
              <Image
                className={styles.customerLogo}
                src={customer.logo}
                alt={customer.name}
                width={customer.logoWidth}
                height={customer.logoHeight}
              />
              <div className={styles.customerFooter}>
                <p className={styles.customerDescription}>{customer.description}</p>
                {customer.href ? (
                  <div className={styles.customerStory}>
                    <Button href={customer.href} text="Read story" variant="tertiary" />
                  </div>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
