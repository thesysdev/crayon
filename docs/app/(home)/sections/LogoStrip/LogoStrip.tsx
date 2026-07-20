import styles from "./LogoStrip.module.css";

const LOGOS = [
  { src: "/logos/oodle.svg", alt: "Oodle AI", href: "https://www.oodle.ai/" },
  {
    src: "/logos/standard-metrics.svg",
    alt: "Standard Metrics",
    href: "https://standardmetrics.io/",
  },
  { src: "/logos/entelligence.svg", alt: "Entelligence AI", href: "https://entelligence.ai/" },
  { src: "/logos/andfacts.svg", alt: "&facts", href: "https://www.andfacts.com/" },
  { src: "/logos/gaia.svg", alt: "GAIA", href: "https://heygaia.io/" },
  { src: "/logos/prox.svg", alt: "Prox", href: "https://useprox.com/" },
  { src: "/logos/productboard.svg", alt: "Productboard", href: "https://productboard.com/" },
];

/* The track holds SETS copies of the logo list and animates by -50%, so the
   second half must mirror the first exactly for a seamless loop. */
const SETS = 4;

export function LogoStrip({ label }: { label?: string }) {
  return (
    <section
      className={`${styles.section} ${label ? styles.sectionWithLabel : ""}`.trim()}
      aria-label="Customers using OpenUI"
    >
      <div className={styles.inner}>
        {label && <p className={styles.label}>{label}</p>}
        <div className={styles.marquee}>
          <div className={styles.track}>
            {Array.from({ length: SETS }, (_, set) =>
              LOGOS.map((logo) => (
                <a
                  key={`${set}-${logo.src}`}
                  className={styles.card}
                  href={logo.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-hidden={set > 0 || undefined}
                  tabIndex={set > 0 ? -1 : undefined}
                >
                  <img
                    className={styles.logo}
                    src={logo.src}
                    alt={set === 0 ? logo.alt : ""}
                    width={160}
                    height={48}
                    loading="lazy"
                  />
                </a>
              )),
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
