import styles from "./sections.module.css";

type Faq = {
  question: string;
  /* One entry per paragraph, matching the home page's FAQ shape. */
  answer: string[];
};

/* The Router-tagged questions from the brief. The first answer is kept close to
   the wording already published in the home page FAQ — the two pages should not
   disagree about whether you need Gateway at all. */
const FAQS: Faq[] = [
  {
    question: "Do I need OpenUI Gateway to use OpenUI?",
    answer: [
      "You don't need Gateway to use OpenUI. You can call any supported LLM directly and pass generateSystemPrompt as the system prompt.",
      "For production applications, Gateway adds GenUI-specific validation, automatic corrections, model routing, and provider fallbacks through an OpenAI-compatible API.",
    ],
  },
  {
    question: "What happens to my data?",
    answer: [
      "Your data is not used to train models, with the exception of free models.",
      "On paid models, the Chat Completions endpoint is zero data retention by default.",
    ],
  },
  {
    question: "Can I use my existing OpenAI or Anthropic credits?",
    answer: [
      "Yes. Set up BYOK and your existing commitments carry over at no platform fee.",
    ],
  },
  {
    question: "I'm already using OpenUI OSS. How do I upgrade?",
    answer: [
      "Change your base URL and model configuration. The integration guide covers the full upgrade path.",
      "You can copy the setup prompt into your coding agent, or book a call if you would like help.",
    ],
  },
  {
    question: "I'm already using a gateway like Portkey. Can I use both?",
    answer: [
      "Yes. Configure OpenUI Gateway as an OpenAI endpoint behind Portkey or any other OpenAI-compatible gateway.",
    ],
  },
  {
    question: "Will my cache configuration work?",
    answer: ["Yes. Upstream cache configurations are honored."],
  },
  {
    question: "What model handles corrections, and do I pay for it separately?",
    answer: [
      "Corrections are handled by a dedicated model tuned for low latency, which we continue to improve.",
      "It is included in your plan and is not billed separately.",
    ],
  },
  {
    question: "Do I need both Gateway and Observability?",
    answer: [
      "No. They work independently.",
      "Use Gateway to make generations more reliable, and Observability to understand sessions, users, errors, and behaviour.",
    ],
  },
];

export function FaqSection() {
  return (
    <section className={styles.section} aria-labelledby="gateway-faq">
      <h2 id="gateway-faq" className={styles.heading}>
        Frequently asked questions
      </h2>

      {/* Built on <details> rather than a JS accordion, the same as the home
          page's FAQ: every answer is in the document for search and for print,
          and it needs no client bundle. */}
      <div className={styles.faqList}>
        {FAQS.map(({ question, answer }) => (
          <details className={styles.faqItem} key={question}>
            <summary className={styles.faqQuestion}>
              <span>{question}</span>
              <span className={styles.faqMarker} aria-hidden="true">
                +
              </span>
            </summary>
            <div className={styles.faqAnswer}>
              {answer.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
