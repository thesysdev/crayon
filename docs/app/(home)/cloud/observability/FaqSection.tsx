import styles from "../sections.module.css";

type Faq = {
  question: string;
  /* One entry per paragraph, matching the home page's FAQ shape. */
  answer: string[];
};

/* The tracing answer is kept close to the wording already published in the home
   page FAQ — the two pages should not disagree about what this product is for.
   The retention answer is the one the page cannot leave out: Observability and
   zero data retention pull against each other, and a reader evaluating both
   products deserves to hit that here rather than during an integration. */
const FAQS: Faq[] = [
  {
    question: "How is this different from tracing tools like Braintrust?",
    answer: [
      "Tracing and eval tools like Braintrust tell you what your agent did.",
      "OpenUI Observability shows what your users actually experienced, including the generated UI, interactions, errors, corrections, and fallbacks.",
      "The two sit at different layers rather than competing, which is why the responses you flag here can be pushed into them as eval cases.",
    ],
  },
  {
    question: "What does the SDK capture?",
    answer: [
      "Settled render events from the OpenUI message bus: timestamps, update counts, error counts, and structured error entries such as the code, source, and component involved.",
      "In full capture it also includes the generated response. In minimal capture it does not.",
    ],
  },
  {
    question: "Is the frontend key safe to expose?",
    answer: [
      "Yes. Frontend keys are publishable by design, the same as an analytics key, and are meant to ship in client code.",
    ],
  },
  {
    question: "What does it cost?",
    answer: [
      "Nothing while OpenUI Observability is in early access.",
      "Pricing will be published before that changes.",
    ],
  },
  {
    question: "Do I need OpenUI Gateway as well?",
    answer: [
      "No. They work independently, and Observability does not require Gateway.",
      "We do recommend running both. Gateway makes generations more reliable, Observability shows you how they landed, and together they cover the whole path from the model to what the user actually experienced.",
    ],
  },
];

export function FaqSection() {
  return (
    <section className={styles.section} aria-labelledby="observability-faq">
      <h2 id="observability-faq" className={styles.heading}>
        Frequently asked questions
      </h2>

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
