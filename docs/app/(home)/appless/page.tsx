import { ArrowRight, ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
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

const features = [
  {
    title: "Just ask",
    description:
      "From a weather dashboard to a booking form, describe the task and watch the screen appear.",
  },
  {
    title: "Native on your phone",
    description: "Interactive components render as Cupertino on iOS and Material 3 on Android.",
  },
  {
    title: "Keep exploring",
    description:
      "Tap a row, button, or card to generate the next screen. Optional prefetch makes likely destinations ready sooner.",
  },
];

export default function AppLessPage() {
  return (
    <div className={styles.page}>
      <main className={styles.container}>
        <section className={styles.appHero} aria-labelledby="appless-title">
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>AppLess</p>
            <h1 id="appless-title">What if your phone had no apps?</h1>
            <p className={styles.lead}>
              Ask for what you need. AppLess creates a native interface for the task, then builds
              the next screen when you tap.
            </p>
            <div className={styles.actions}>
              <BevelButton
                href={github}
                external
                variant="primary"
                label="Explore on GitHub"
                badge={<ArrowUpRight size={16} />}
              />
            </div>
          </div>
          <AppLessDemo />
        </section>

        <section className={styles.section} aria-labelledby="appless-features">
          <h2 id="appless-features" className={styles.sectionTitle}>
            From a request to a native interface
          </h2>
          <div className={styles.featureGrid}>
            {features.map((feature) => (
              <article className={styles.feature} key={feature.title}>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </article>
            ))}
          </div>
          <div className={styles.powered}>
            <h3>Powered by OUI-1 and OpenUI</h3>
            <div>
              <p>
                OUI-1 generates the interface in OpenUI Lang. OpenUI renders it into native
                components as it streams.
              </p>
              <div className={styles.textLinks}>
                <Link href="/oui-1">
                  Meet OUI-1 <ArrowRight size={16} />
                </Link>
                <Link href="/docs/openui-lang">
                  Explore OpenUI Lang <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.closing} aria-labelledby="appless-future">
          <h2 id="appless-future">A glimpse of what comes next</h2>
          <p className={styles.closingLead}>
            Start with an open-source experiment in software that takes shape around your intent.
            Fork AppLess, extend its components, and connect it to your own services.
          </p>
          <p className={styles.disclosure}>
            Today, bookings, purchases, and payments are simulated. Optional search tools can ground
            screen content in real information.
          </p>
          <div className={styles.actions}>
            <BevelButton
              href={github}
              external
              variant="primary"
              label="Fork AppLess"
              badge={<ArrowUpRight size={16} />}
            />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
