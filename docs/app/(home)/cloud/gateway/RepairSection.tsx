import { ProofLine } from "../../components/ProofLine/ProofLine";
import { production } from "@/lib/benchmark-data";
import styles from "./sections.module.css";

/* PLACEHOLDER — do not ship. Both halves of this claim are still open: the
   figure itself, and its denominator. "Of all generations" is the strong
   reading and the one worth confirming; "of all errors" would mean the rest
   went uncorrected, which reads worse than the 88% repair rate the platform
   already publishes. Every other number on this page is read from
   benchmark-data.ts — this one cannot be, because it is one customer's traffic
   rather than ours, so it needs Entelligence to confirm it before it is real. */
const ENTELLIGENCE_CORRECTION_RATE = "XX";

/* The answer to the section above, and only that. It states the outcome and the
   one reason a general-purpose gateway cannot reach it; how the repair is built
   — the parser, the validator, the model that patches the node — is a docs
   concern and used to live here at three times this length.

   The heading mirrors WhySection's: that one names the failure, this one names
   what happens to it. Self-contained on purpose — people land here from anchors
   and scrolls, so it cannot lean on the section above for its subject. */
export function RepairSection() {
  return (
    <section className={styles.section} aria-labelledby="gateway-repair">
      <h2 id="gateway-repair" className={styles.heading}>
        Gateway repairs broken output before it renders
      </h2>
      <p className={styles.lead}>
        Gateway validates every response against your component library and repairs the invalid ones
        in the streaming path, not as a retry your user waits through. Under{" "}
        {Math.ceil(production.userVisibleShare)}% of generations still reach a user broken.
      </p>

      {/* PLACEHOLDER — artwork pending. The diagram this stands in for: the
          component schema and the prompt go into Gateway; a valid response
          returns straight to the client; an invalid one goes to a small repair
          model, which streams the delta. The schema arrow is the part that has
          to be legible — it is the reason a general-purpose gateway cannot do
          this, and nothing in the copy says so any more. */}
      <div className={styles.artPlaceholder} aria-hidden="true">
        <p className={styles.artPlaceholderLabel}>
          Diagram: component schema + prompt → Gateway → valid response returns to the client;
          invalid response goes to a small repair model, which streams the delta.
        </p>
      </div>


      {/* Proof sits inside this section rather than getting one of its own: it is
          evidence for the claim above it, and a heading would give it more weight
          than one line of copy can carry. */}
      <div className={styles.proof}>
        <ProofLine
          logoSrc="/logos/entelligence.svg"
          company="Entelligence"
          href="https://www.thesys.dev/customers/entelligence"
        >
          ships Ask Ellie in production, where Gateway corrects {ENTELLIGENCE_CORRECTION_RATE}% of
          all generations.
        </ProofLine>
      </div>
    </section>
  );
}
