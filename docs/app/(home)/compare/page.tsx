import type { Metadata } from "next";
import { PageHero, PageHeroAccent } from "../components/PageHero/PageHero";
import { Footer } from "../sections/Footer/Footer";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "OpenUI Compare",
  description: "How AI apps look with and without OpenUI.",
  alternates: { canonical: "/compare" },
  openGraph: {
    title: "OpenUI Compare",
    description: "How AI apps look with and without OpenUI.",
    url: "/compare",
    type: "website",
  },
  twitter: {
    title: "OpenUI Compare",
    description: "How AI apps look with and without OpenUI.",
    card: "summary_large_image",
  },
};

const POINTS = [
  {
    title: "Same prompt, same model",
    body: "Both sides answer the identical request. The only difference is whether the model replies in prose or in UI.",
  },
  {
    title: "Answers you can act on",
    body: "Cards, filters, and buttons instead of a wall of text — so the next step is a click, not a follow-up question.",
  },
  {
    title: "Cheaper than JSON",
    body: "OpenUI describes the same interface roughly 3x faster and on about 67% fewer tokens than hand-rolled JSON.",
  },
];

export default function ComparePage() {
  return (
    <main className={styles.page}>
      <PageHero
        smallSubtitle
        title={
          <>
            With and <PageHeroAccent>without OpenUI</PageHeroAccent>
          </>
        }
        subtitle={
          <>
            The same question, answered twice.
            <br />
            Once as plain text, once as a generated interface.
          </>
        }
      />

      <div className={styles.section}>
        <div className={styles.shotFrame}>
          {/* Both variants render; CSS reveals the one matching the theme, so
              there's no hydration flash on first paint. */}
          <img
            src="/homepage/hero-web.webp"
            alt="The same hotel request answered as plain text on the left and as a generated interface on the right"
            width={2304}
            height={1362}
            className={`${styles.shot} ${styles.shotLight}`}
            draggable={false}
          />
          <img
            src="/homepage/hero-web-dark.webp"
            alt=""
            aria-hidden="true"
            width={2304}
            height={1362}
            className={`${styles.shot} ${styles.shotDark}`}
            draggable={false}
          />
        </div>

        <div className={styles.points}>
          {POINTS.map((point) => (
            <section className={styles.point} key={point.title}>
              <h2 className={styles.pointTitle}>{point.title}</h2>
              <p className={styles.pointBody}>{point.body}</p>
            </section>
          ))}
        </div>
      </div>

      <Footer />
    </main>
  );
}
