import { ArrowRight, ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import gatewayStyles from "../cloud/gateway/page.module.css";
import { BevelButton } from "../components/Button/BevelButton";
import { ClipboardCommandButton } from "../components/Button/Button";
import { FadedDither } from "../components/FadedDither/FadedDither";
import styles from "../components/ProductLanding.module.css";
import homeStyles from "../page.module.css";
import { Footer } from "../sections/Footer/Footer";
import { HeroSection } from "../sections/HeroSection/HeroSection";
import { FaqSection } from "./FaqSection";
import howTo from "./HowTo.module.css";
import { OuiFeatures } from "./OuiFeatures";

export const metadata: Metadata = {
  title: "OUI-1 | An open model built for Generative UI",
  description:
    "A DiffusionGemma finetune that writes OpenUI Lang, with 4B active parameters, a 71.7% Generative UI Benchmark score, and Apache 2.0 weights.",
  alternates: { canonical: "/oui-1" },
  openGraph: {
    title: "OUI-1 | An open model built for Generative UI",
    description:
      "Generate interfaces from your components with an open-weight model built for OpenUI Lang.",
    url: "/oui-1",
    type: "website",
  },
};
const model = "https://huggingface.co/thesysdev/OUI-1";
const research = "/blog/oui-1";
const guide = "/docs/build-agents/ui-generation";
const steps = [
  {
    title: "Serve the model",
    description:
      "On your GPU host, install vLLM 0.24 or newer and start OUI-1. This exposes an OpenAI-compatible API at localhost:8000/v1.",
    codeTitle: "GPU host",
    code: [
      'pip install "vllm>=0.24"',
      "vllm serve thesysdev/OUI-1 \\",
      "  --trust-remote-code \\",
      "  --quantization fp8 \\",
      "  --max-model-len 16384 \\",
      "  --served-model-name OUI-1 \\",
      "  --max-num-seqs 4 \\",
      "  --enable-auto-tool-choice \\",
      "  --tool-call-parser gemma4",
    ].join("\n"),
    link: model + "#vllm-recommended",
    linkLabel: "Model serving guide",
    external: true,
  },
  {
    title: "Define your components",
    description:
      "Export a library of your components and props from src/library.ts. Generate the system prompt so OUI-1 knows what it can build.",
    codeTitle: "System prompt",
    code: [
      "npx @openuidev/cli@latest \\",
      "  generate src/library.ts \\",
      "  --out system-prompt.txt",
    ].join("\n"),
    link: "/docs/openui-lang/defining-components",
    linkLabel: "Define a component library",
    external: false,
  },
  {
    title: "Render the response",
    description:
      "Call your endpoint with model OUI-1, the generated system prompt, and stream: true. Pass the arriving text to OpenUI's Renderer with the same library.",
    codeTitle: "React renderer",
    code: [
      "<Renderer",
      "  library={library}",
      "  response={text}",
      "  isStreaming={isStreaming}",
      "/>",
    ].join("\n"),
    link: guide + "#6-stream-the-response-to-the-chat-ui",
    linkLabel: "Connect the response stream",
    external: false,
  },
];
/* One half of a laurel: leaf pairs set along an arc, outer and inner. */
function LaurelBranch({ mirrored }: { mirrored?: boolean }) {
  const CX = 44;
  const CY = 30;
  const R = 30;
  const nodes = [122, 142, 162, 182, 202, 222];
  const point = (deg: number) => {
    const rad = (deg * Math.PI) / 180;
    return [CX + R * Math.cos(rad), CY + R * Math.sin(rad)];
  };
  const [x0, y0] = point(112);
  const [x1, y1] = point(232);
  return (
    <svg
      aria-hidden="true"
      className={styles.laurel}
      width="36"
      height="64"
      viewBox="0 0 36 64"
      style={mirrored ? { transform: "scaleX(-1)" } : undefined}
    >
      <path
        className={styles.laurelStem}
        d={`M${x0.toFixed(1)} ${y0.toFixed(1)}A${R} ${R} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`}
      />
      {nodes.flatMap((deg) => {
        const [x, y] = point(deg);
        // lean each leaf off the stem's tangent: one outward, one inward
        return [deg + 50, deg + 130].map((turn) => (
          <path
            key={`${deg}-${turn}`}
            d="M0 0C3 -3 8 -3 11 0C8 3 3 3 0 0Z"
            transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${turn})`}
          />
        ));
      })}
    </svg>
  );
}

export default function OuiOnePage() {
  const artwork = (
    <div className={`${gatewayStyles.heroArtSpace} ${styles.ouiArtStage}`}>
      <FadedDither band="light" className={gatewayStyles.heroShader} />
      <div className={gatewayStyles.heroArtwork}>
        <iframe
          src="/oui-1/hero.html"
          title="The same question answered two ways: a wall of streamed text without OpenUI, and a rendered health dashboard with it"
          className={styles.ouiArtFrame}
          scrolling="no"
        />
      </div>
    </div>
  );
  return (
    <div className={`${homeStyles.page} ${styles.pageFocus} ${styles.ouiPage}`}>
      <div className={homeStyles.heroShell}>
        <HeroSection
          align="left"
          desktopFromTablet
          smallSubtitle
          tightDesktopSpacing={false}
          splitLockup
          flushInnerInlinePadding
          title={
            <span className={gatewayStyles.titleBlock}>
              <span className={gatewayStyles.eyebrow}>
                OpenUI <span className={gatewayStyles.cloudTag}>OUI-1</span>
              </span>
              <span className={gatewayStyles.title}>An open model built for Generative UI</span>
            </span>
          }
          subtitle={
            <span className={`${gatewayStyles.subtitle} ${styles.heroSubtitle}`}>
              Generate interfaces from your own components.{" "}
              <span className={styles.noWrap}>OUI-1</span> writes{" "}
              <span className={styles.noWrap}>OpenUI Lang,</span> ready to render as it streams.
            </span>
          }
          commandSlot={
            <div className={gatewayStyles.ctaGroup}>
              <BevelButton
                href={model}
                external
                variant="primary"
                label="Get the model"
                badge={<ArrowUpRight size={16} strokeWidth={2.25} />}
              />
              <BevelButton
                href={research}
                variant="secondary"
                label="Read the research"
                badge={<ArrowUpRight size={16} strokeWidth={2.25} />}
              />
            </div>
          }
          showPlaygroundButton={false}
          showGitHubBanner={false}
          showTagline={false}
          desktopPreviewSlot={artwork}
          mobilePreviewSlot={artwork}
        />
      </div>
      <main>
        <div className={styles.statementBand}>
          <p className={styles.statement}>
            General-purpose models are built for text.
            <br className={styles.statementBreak} /> OUI-1 is purpose-built for interfaces.{" "}
            <span>
              It transforms natural language into fast, reliable, interactive interfaces using your
              own components.
            </span>
          </p>
        </div>
        <div className={styles.featuresBand}>
          <div className={styles.featuresInner}>
            <OuiFeatures />
          </div>
        </div>
        <section className={styles.howBand} aria-labelledby="oui-how-title">
          <div className={styles.howInner}>
            <div className={styles.howHead}>
              <h2 id="oui-how-title" className={styles.howTitle}>
                Build your first interface with OUI-1.
              </h2>
              <BevelButton
                href={guide}
                variant="secondary"
                label="Read setup docs"
                badge={<ArrowRight size={16} strokeWidth={2.25} />}
              />
            </div>
            <ol className={styles.steps}>
              {steps.map((step, index) => (
                <li key={step.title} className={`${styles.step} ${howTo.step}`}>
                  <span className={styles.stepBadge}>{index + 1}</span>
                  <h3 className={styles.stepTitle}>{step.title}</h3>
                  <p className={`${styles.stepDescription} ${howTo.description}`}>
                    {step.description}
                  </p>
                  <div className={howTo.codeBox}>
                    <div className={howTo.codeHeader}>
                      <span>{step.codeTitle}</span>
                      <ClipboardCommandButton
                        command={step.code}
                        className={howTo.copyButton}
                        copyIconColor="currentColor"
                      >
                        <span>Copy</span>
                      </ClipboardCommandButton>
                    </div>
                    <pre className={howTo.code}>
                      <code>{step.code}</code>
                    </pre>
                  </div>
                  <a
                    href={step.link}
                    className={howTo.docLink}
                    {...(step.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  >
                    {step.linkLabel} <ArrowUpRight size={15} aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ol>
            <p className={howTo.requirements}>
              FP8 weights need about 25.8 GiB of GPU memory, plus runtime and cache. Check the model
              serving guide before choosing your hardware.
            </p>
          </div>
        </section>
        <div className={styles.productFaqBand}>
          <FaqSection />
        </div>
        <div className={`${styles.statementBand} ${styles.closingBand}`}>
          <div className={styles.openBadge}>
            <LaurelBranch />
            <span className={styles.openLabel}>Open-Source</span>
            <LaurelBranch mirrored />
          </div>
          <h2 className={`${styles.statement} ${styles.statementLarge}`}>
            Open weights, Apache 2.0
          </h2>
          <p className={styles.statementLead}>
            Download, customize, fine-tune, and deploy OUI-1 on your own infrastructure. Built for
            everyone, with no vendor lock-in.
          </p>
          <div className={`${gatewayStyles.ctaGroup} ${styles.statementActions}`}>
            <BevelButton
              href={model}
              external
              variant="primary"
              label="Get the model"
              badge={<ArrowUpRight size={16} strokeWidth={2.25} />}
            />
            <BevelButton
              href={research}
              variant="secondary"
              label="Read the research"
              badge={<ArrowUpRight size={16} strokeWidth={2.25} />}
            />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
