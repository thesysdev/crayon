import { ArrowDownUp, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import styles from "./openui-architecture-overview.module.css";

type ProductExplanation = {
  number: string;
  title: string;
  description: string;
  href: string;
  linkLabel: string;
};

const explanations: ProductExplanation[] = [
  {
    number: "01",
    title: "Agent Interface",
    description:
      "Agent Interface is a frontend SDK for building agentic experiences. It includes streaming conversations, thread history, native support for generative UI, and an artifact workspace without requiring you to assemble the application shell from scratch.",
    href: "/docs/agent/getting-started/introduction",
    linkLabel: "Explore Agent Interface",
  },
  {
    number: "02",
    title: "OpenUI Lang",
    description:
      "OpenUI Lang is an open-source, streaming-first language and runtime for generative UI. Agents compose interfaces from your component library, while the runtime parses and renders their output progressively as it streams.",
    href: "/docs/openui-lang",
    linkLabel: "Explore OpenUI Lang",
  },
  {
    number: "03",
    title: "OpenUI Cloud",
    description:
      "OpenUI Cloud is the managed backend for OpenUI. It provides model access and automatic fallbacks, validates generated output, persists conversations and artifacts, and includes built-in tools, reports, and presentations.",
    href: "/docs/openui-cloud",
    linkLabel: "Explore OpenUI Cloud",
  },
];

function Connector() {
  return (
    <div className={styles.connector} aria-hidden="true">
      <ArrowDownUp size={18} strokeWidth={1.6} />
    </div>
  );
}

function ArchitectureDiagram() {
  return (
    <figure className={styles.diagram} aria-label="OpenUI architecture and ecosystem">
      <div className={styles.surfaceRow}>
        <div className={`${styles.node} ${styles.nodeAgent}`}>Agent Interface</div>
        <div className={styles.node}>CopilotKit</div>
        <div className={styles.node}>assistant-ui</div>
        <div className={styles.node}>Custom</div>
      </div>

      <Connector />

      <div className={`${styles.node} ${styles.nodeRuntime}`}>
        <span className={styles.runtimeTag}>
          <Sparkles size={12} strokeWidth={2} aria-hidden="true" />
          Gen UI
        </span>
        OpenUI Lang runtime
      </div>

      <Connector />

      <div className={styles.frameworkRow}>
        <div className={styles.node}>LangGraph</div>
        <div className={styles.node}>Mastra</div>
        <div className={styles.node}>Vercel AI SDK</div>
      </div>

      <Connector />

      <div className={styles.backendRow}>
        <div className={`${styles.backendNode} ${styles.nodeCloud}`}>
          <strong>OpenUI Cloud</strong>
          <span>Models · validation · persistence · built-in artifacts</span>
        </div>
        <div className={`${styles.backendNode} ${styles.nodeManaged}`}>
          <strong>Self-managed</strong>
          <span>Provider · API route · storage · tools</span>
        </div>
      </div>

      <Connector />

      <div className={styles.providerRow}>
        <div className={styles.providerNode}>Anthropic</div>
        <div className={styles.providerNode}>OpenAI</div>
        <div className={styles.providerNode}>Google Gemini</div>
      </div>
    </figure>
  );
}

export function OpenUIArchitectureOverview() {
  return (
    <section className={styles.layout} aria-label="OpenUI products and architecture">
      <div className={styles.diagramColumn}>
        <ArchitectureDiagram />
      </div>

      <div className={styles.explanations}>
        {explanations.map((item) => (
          <article className={styles.explanation} key={item.number}>
            <span className={styles.number} aria-hidden="true">
              {item.number}
            </span>
            <div className={styles.explanationBody}>
              <h2>{item.title}</h2>
              <p>{item.description}</p>
              <Link href={item.href} className={styles.explanationLink}>
                {item.linkLabel}
                <ArrowRight size={17} strokeWidth={2} aria-hidden="true" />
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
