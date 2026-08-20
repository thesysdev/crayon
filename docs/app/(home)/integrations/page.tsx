import { PageHero, PageHeroAccent } from "@/app/(home)/components/PageHero/PageHero";
import { Footer } from "@/app/(home)/sections/Footer/Footer";
import { ArrowRight, Boxes, Layers3 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getIntegrationsByCategory, integrationCategories } from "./data";
import { IntegrationLogo } from "./integration-logo";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Integrations",
  description:
    "Explore OpenUI integrations across design systems, frontend frameworks, and backend frameworks.",
  alternates: { canonical: "/integrations" },
  openGraph: {
    title: "OpenUI integrations",
    description: "Build generative UI with the design systems and frameworks you know.",
    url: "/integrations",
    type: "website",
  },
};

export default function IntegrationsPage() {
  return (
    <main className={styles.page}>
      <PageHero
        eyebrow="OpenUI ecosystem"
        title={
          <>
            Build with the tools
            <br />
            <PageHeroAccent>you already use.</PageHeroAccent>
          </>
        }
        subtitle={
          <>Start with a design system, frontend framework, or backend framework your team knows.</>
        }
        smallSubtitle
      />

      <div className={styles.contentBand}>
        <section className={styles.directory} aria-labelledby="integration-directory-title">
          <div className={styles.directoryIntro}>
            <div>
              <p className={styles.sectionEyebrow}>
                <Layers3 size={14} aria-hidden="true" />
                Integration directory
              </p>
              <h2 id="integration-directory-title" className={styles.sectionTitle}>
                OpenUI across your stack
              </h2>
            </div>
            <p className={styles.directoryDescription}>
              Three simple ways into OpenUI. Popular starting points appear first, and each page
              links to the relevant docs or runnable source.
            </p>
          </div>

          <nav className={styles.categoryNav} aria-label="Integration categories">
            {integrationCategories.map((category) => (
              <a className={styles.categoryNavLink} href={`#${category.id}`} key={category.id}>
                {category.shortTitle}
                <span>{getIntegrationsByCategory(category.id).length}</span>
              </a>
            ))}
          </nav>

          <div className={styles.categoryList}>
            {integrationCategories.map((category, categoryIndex) => {
              const items = getIntegrationsByCategory(category.id);

              return (
                <section
                  className={styles.categorySection}
                  data-accent={category.accent}
                  id={category.id}
                  key={category.id}
                >
                  <header className={styles.categoryHeader}>
                    <div className={styles.categoryIndex} aria-hidden="true">
                      {String(categoryIndex + 1).padStart(2, "0")}
                    </div>
                    <div className={styles.categoryHeading}>
                      <h2>{category.title}</h2>
                      <p>{category.description}</p>
                    </div>
                    <span className={styles.categoryCount}>{items.length}</span>
                  </header>

                  <div className={styles.grid}>
                    {items.map((item, itemIndex) => (
                      <Link
                        className={styles.card}
                        href={`/integrations/${item.slug}`}
                        key={item.slug}
                      >
                        <div className={styles.cardTopline}>
                          <IntegrationLogo className={styles.mark} integration={item} />
                          <span className={styles.popularityRank}>
                            {String(itemIndex + 1).padStart(2, "0")}
                          </span>
                        </div>
                        <div className={styles.cardBody}>
                          <div className={styles.cardTitleRow}>
                            <h3>{item.name}</h3>
                            <ArrowRight className={styles.cardArrow} size={18} aria-hidden="true" />
                          </div>
                          <p>{item.summary}</p>
                        </div>
                        <div className={styles.cardMeta}>
                          {item.support ? (
                            <span data-support={item.support}>{item.support}</span>
                          ) : null}
                          <span>{item.type}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>

          <section className={styles.directoryCta}>
            <span className={styles.ctaIcon} aria-hidden="true">
              <Boxes size={22} />
            </span>
            <div>
              <h2>Building another integration?</h2>
              <p>
                Share an adapter, component library, example, or tool with the OpenUI community.
              </p>
            </div>
            <Link className={styles.ctaLink} href="/lab">
              Visit the Lab
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </section>
        </section>
      </div>

      <Footer />
    </main>
  );
}
