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

function ArrowUpRight() {
  return (
    <svg
      className={styles.chipArrow}
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 9L9 3M4.5 3H9v4.5" />
    </svg>
  );
}

export function LogoStrip() {
  return (
    <section className={styles.section} aria-label="Customers using OpenUI">
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
                <span className={styles.chip}>
                  Website
                  <ArrowUpRight />
                </span>
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
    </section>
  );
}
