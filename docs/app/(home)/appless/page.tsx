import { ArrowRight, ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import { BevelButton } from "../components/Button/BevelButton";
import styles from "../components/ProductLanding.module.css";
import { Footer } from "../sections/Footer/Footer";
import { AppLessDemo } from "./AppLessDemo";

export const metadata: Metadata = {
  title: "AppLess | What if your phone had no apps?",
  description:
    "Ask for what you need. AppLess generates a native interface for the task, then builds the next screen when you tap.",
  alternates: { canonical: "/appless" },
  openGraph: {
    title: "AppLess | What if your phone had no apps?",
    description:
      "An open-source experiment that generates native interfaces around the task at hand.",
    url: "/appless",
    type: "website",
  },
};

const github = "https://github.com/thesysdev/appless";

const steps = [
  {
    number: "01",
    title: "Just ask",
    description:
      "Describe the interface you need, from a weather dashboard or restaurant list to a booking form. AppLess generates the screen on demand.",
  },
  {
    number: "02",
    title: "Native on each platform",
    description:
      "OpenUI renders the same generated screen with Cupertino components on iOS and Material 3 components on Android.",
  },
  {
    number: "03",
    title: "Keep exploring",
    description:
      "Tap a row, button, or card to request the next screen. Optional prefetch trades extra model requests for faster navigation.",
  },
];

export default function AppLessPage() {
  return (
    <div className={styles.page}>
      <main>
        <section className={`${styles.shell} ${styles.applessHero}`}>
          <div className={styles.heroCopy}>
            <p className={styles.productName}>AppLess</p>
            <h1 className={styles.heroTitle}>What if your phone had no apps?</h1>
            <p className={styles.heroLead}>{metadata.description}</p>
            <div className={styles.actions}>
              <BevelButton
                href={github}
                external
                variant="primary"
                label="Explore on GitHub"
                badge={<ArrowUpRight size={16} strokeWidth={2.25} />}
              />
            </div>
          </div>
          <AppLessDemo />
        </section>

        <section className={`${styles.shell} ${styles.section}`}>
          <div className={styles.sectionHeader}>
            <h2>One request becomes a native interface</h2>
            <p>
              AppLess keeps the interaction loop on the phone while generating each screen for the
              task in front of you.
            </p>
          </div>
          <div className={styles.stepGrid}>
            {steps.map((step) => (
              <article className={styles.step} key={step.number}>
                <span className={styles.stepNumber} aria-hidden="true">
                  {step.number}
                </span>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.softBand}>
          <div className={`${styles.shell} ${styles.mechanism}`}>
            <div className={styles.sectionHeader}>
              <h2>Powered by OUI-1 and OpenUI</h2>
              <p>
                The app’s component contract tells OUI-1 which interfaces it can compose. OUI-1
                writes OpenUI Lang, and OpenUI renders the stream as native components.
              </p>
            </div>
            <ol className={styles.pipeline}>
              <li>
                <span>Component contract</span>
                Defines the native components the model can use.
              </li>
              <li>
                <span>OUI-1</span>
                Generates an OpenUI Lang screen from the request.
              </li>
              <li>
                <span>OpenUI renderer</span>
                Parses the stream into Cupertino or Material 3 components.
              </li>
            </ol>
            <p className={styles.technicalNote}>
              OUI-1 runs on a separate vLLM GPU server. The phone is the client.
            </p>
          </div>
        </section>

        <section className={`${styles.shell} ${styles.boundarySection}`}>
          <div className={styles.sectionHeader}>
            <h2>Real information and real actions are separate</h2>
            <p>
              AppLess can ground what a screen shows without pretending that every button is
              connected to a service.
            </p>
          </div>
          <div className={styles.boundaryGrid}>
            <article>
              <h3>Optional grounding</h3>
              <p>Web and image tools can bring current information into generated screens.</p>
            </article>
            <article>
              <h3>Your integrations</h3>
              <p>
                Ordering, booking, paying, playback, and other state-changing actions remain
                simulations until a developer connects the relevant service.
              </p>
            </article>
          </div>
        </section>

        <section className={`${styles.shell} ${styles.closing}`}>
          <div>
            <h2>An open experiment, ready to be extended</h2>
            <p>
              Fork AppLess, connect the tools and systems you choose, or inspect the model and
              language behind it.
            </p>
          </div>
          <div className={styles.actions}>
            <BevelButton
              href={github}
              external
              variant="primary"
              label="Fork AppLess on GitHub"
              badge={<ArrowUpRight size={16} strokeWidth={2.25} />}
            />
            <BevelButton
              href="/oui-1"
              variant="secondary"
              label="Meet OUI-1"
              badge={<ArrowRight size={16} strokeWidth={2.25} />}
            />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
