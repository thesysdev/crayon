import styles from "./LogoStrip.module.css";

const LOGOS = [
  { src: "/logos/oodle.svg", alt: "Oodle AI" },
  { src: "/logos/standard-metrics.svg", alt: "Standard Metrics" },
  { src: "/logos/entelligence.svg", alt: "Entelligence AI" },
  { src: "/logos/andfacts.svg", alt: "&facts" },
  { src: "/logos/gaia.svg", alt: "GAIA" },
];

export function LogoStrip() {
  return (
    <section className={styles.section} aria-label="Customers using OpenUI">
      <div className={styles.row}>
        {LOGOS.map((logo) => (
          <img
            key={logo.src}
            className={styles.logo}
            src={logo.src}
            alt={logo.alt}
            width={160}
            height={48}
            loading="lazy"
          />
        ))}
      </div>
    </section>
  );
}
