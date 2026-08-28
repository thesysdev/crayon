import styles from "../sections.module.css";

/* The problem, with no product in it — the mirror of the Gateway page's opening
   section. Nothing here is measured, because there is no dataset for it the way
   there is for rendering failures; the argument is a distinction rather than a
   number, so the rows name the three questions execution data cannot answer. */
const BLIND_SPOTS = [
  {
    term: "Did it work?",
    description:
      "A successful trace and a useless answer look identical in execution data. Every tool call can land and still leave the user without what they came for.",
  },
  {
    term: "What did they see?",
    description:
      "Traces record the response your agent produced, not the interface it rendered into, and not what the user did with it.",
  },
  {
    term: "What should we build?",
    description:
      "Latency and error rates say nothing about which capabilities users reached for and did not find.",
  },
];

export function WhySection() {
  return (
    <section className={styles.section} aria-labelledby="observability-why">
      <h2 id="observability-why" className={styles.heading}>
        Traces tell you what your agent did, not whether it worked
      </h2>
      <p className={styles.lead}>
        Tracing tools were built for services, where a request either succeeds or fails. An agent
        can do everything right and still be wrong.
      </p>

      <ul className={styles.rows}>
        {BLIND_SPOTS.map((item) => (
          <li className={styles.row} key={item.term}>
            <span className={styles.term}>{item.term}</span>
            <p className={styles.desc}>{item.description}</p>
          </li>
        ))}
      </ul>

      <p className={styles.closer}>
        OpenUI Observability connects responses to whether they actually worked for the person
        reading them, rather than to how they executed.
      </p>
    </section>
  );
}
