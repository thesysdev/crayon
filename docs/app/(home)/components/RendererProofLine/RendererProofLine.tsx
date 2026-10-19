import { ArrowRight } from "lucide-react";
import Link from "next/link";
import styles from "./RendererProofLine.module.css";

const RENDERERS = [
  { name: "React", logo: "/integration-logos/react.svg" },
  { name: "Vue", logo: "/integration-logos/vue.svg" },
  { name: "Svelte", logo: "/integration-logos/svelte.svg" },
  { name: "Angular", logo: "/integration-logos/angular.svg", invertInDark: true },
  { name: "Lynx", logo: "/integration-logos/lynx.svg", invertInDark: true },
];

/* One quiet line under the hero CTA: the renderers OpenUI ships for or has a
   guide for, linking to the full integrations list. */
export function RendererProofLine({ lead = "Renders in" }: { lead?: string }) {
  return (
    <Link className={styles.line} href="/docs/integrations">
      <span className={styles.lead}>{lead}</span>
      <ul className={styles.list}>
        {RENDERERS.map((renderer) => (
          <li key={renderer.name} className={styles.item}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className={`${styles.logo} ${renderer.invertInDark ? styles.logoInvertDark : ""}`.trim()}
              src={renderer.logo}
              alt=""
              width={16}
              height={16}
            />
            <span className={styles.name}>{renderer.name}</span>
          </li>
        ))}
      </ul>
      <span className={styles.more}>
        and more
        <ArrowRight className={styles.arrow} aria-hidden />
      </span>
    </Link>
  );
}
