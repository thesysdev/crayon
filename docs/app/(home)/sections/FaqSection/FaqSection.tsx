import styles from "./FaqSection.module.css";

type Faq = {
  question: string;
  /* One entry per paragraph. */
  answer: string[];
};

const FAQS: Faq[] = [
  {
    question: "What should I use to build a Generative UI app?",
    answer: [
      "Start with OpenUI Lang, the free and open-source language and runtime for Generative UI.",
      "For production, we recommend adding OpenUI Gateway for reliability and OpenUI Observability for monitoring and product analytics.",
    ],
  },
  {
    question: "Is OpenUI Lang free and open source?",
    answer: [
      "Yes. OpenUI Lang is fully open source and works with your own models, infrastructure, components, and design system.",
      "OpenUI Gateway and OpenUI Observability are managed services for teams running Generative UI in production.",
    ],
  },
  {
    question: "Why should I use OpenUI Gateway?",
    answer: [
      "You don't need Gateway to use OpenUI Lang. You can call any supported LLM directly.",
      "For production applications, OpenUI Gateway is recommended because it adds GenUI-specific validation, automatic corrections, model routing, and provider fallbacks through an OpenAI-compatible API.",
      "You can usually adopt it by changing your base URL and model configuration.",
    ],
  },
  {
    question: "How is OpenUI Observability different from tracing tools?",
    answer: [
      "Tracing tools tell you what your agent did.",
      "OpenUI Observability shows what your users actually experienced, including generated UI, interactions, errors, corrections, fallbacks, and product behaviour.",
      "It connects agent execution with whether the experience actually worked for the user.",
    ],
  },
  {
    question: "Do I need both Gateway and Observability?",
    answer: [
      "No. They work independently.",
      "Use Gateway to make generations more reliable.",
      "Use Observability to understand sessions, users, errors, and behaviour.",
      "Together, they give you the full picture from model generation to user experience.",
    ],
  },
  {
    question: "Can OpenUI work with my existing stack?",
    answer: [
      "Yes. OpenUI works with your existing LLMs, agent frameworks, design systems, and infrastructure.",
      "You can bring your own OpenAI, Anthropic, or Google keys, use custom component libraries, and run OpenUI Gateway behind other OpenAI-compatible gateways such as Portkey.",
    ],
  },
];

/* Closing FAQ. Title and contact note on the left, the questions on the right.
 *
 * Built on <details>, not a JS accordion, for two reasons: every answer is in
 * the markup whether or not it is open, so crawlers and coding agents reading
 * the page get the full text even while every item is collapsed; and it keeps
 * working with no JavaScript.
 */
export function FaqSection() {
  return (
    <section className={styles.section} aria-labelledby="faq-title">
      <div className={styles.lead}>
        <h2 id="faq-title" className={styles.title}>
          Frequently asked questions
        </h2>
        <p className={styles.note}>
          If you can&rsquo;t find your answer here, join our{" "}
          <a
            className={styles.noteLink}
            href="https://discord.com/invite/Pbv5PsqUSv"
            target="_blank"
            rel="noopener noreferrer"
          >
            Discord
          </a>
          .
        </p>
      </div>

      <div className={styles.list}>
        {FAQS.map(({ question, answer }) => (
          <details className={styles.item} key={question}>
            <summary className={styles.question}>
              <span className={styles.questionText}>{question}</span>
              {/* Two bars making a plus; the upright one collapses when open,
                  leaving a minus. */}
              <span className={styles.marker} aria-hidden="true" />
            </summary>
            <div className={styles.answer}>
              {answer.map((paragraph) => (
                <p className={styles.paragraph} key={paragraph}>
                  {paragraph}
                </p>
              ))}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
