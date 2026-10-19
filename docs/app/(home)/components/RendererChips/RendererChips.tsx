import styles from "./RendererChips.module.css";

const PACKAGES_URL = "https://github.com/thesysdev/openui/tree/main/packages";

/* `source` is each renderer's own package, so a chip opens the code behind it. */
const RENDERERS = [
  { name: "React", logo: "/integration-logos/react.svg", source: `${PACKAGES_URL}/react-lang` },
  { name: "Vue", logo: "/integration-logos/vue.svg", source: `${PACKAGES_URL}/vue-lang` },
  { name: "Svelte", logo: "/integration-logos/svelte.svg", source: `${PACKAGES_URL}/svelte-lang` },
  {
    name: "Angular",
    logo: "/integration-logos/angular.svg",
    source: `${PACKAGES_URL}/angular-lang`,
    invertInDark: true,
  },
  {
    name: "Lynx",
    logo: "/integration-logos/lynx.svg",
    source: "https://github.com/lynx-family/lynx-stack/tree/main/packages/genui/openui",
    invertInDark: true,
  },
];

/* The renderer chips, inline in a sentence, each linking to its source.
   Phrasing content only, so they can sit in a <p>. */
export function RendererChips() {
  return (
    <>
      {RENDERERS.map((renderer) => (
        <a
          key={renderer.name}
          className={styles.chip}
          href={renderer.source}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${renderer.name} renderer source on GitHub`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className={`${styles.logo} ${renderer.invertInDark ? styles.logoInvertDark : ""}`.trim()}
            src={renderer.logo}
            alt=""
            width={16}
            height={16}
          />
          {renderer.name}
        </a>
      ))}
    </>
  );
}
