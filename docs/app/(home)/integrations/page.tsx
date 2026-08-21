import { PageHero, PageHeroAccent } from "@/app/(home)/components/PageHero/PageHero";
import { Footer } from "@/app/(home)/sections/Footer/Footer";
import { ArrowRight, Boxes, Layers3 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { CategoryNav } from "./category-nav";
import { getIntegrationsByCategory, integrationCategories } from "./data";
import { IntegrationLogo } from "./integration-logo";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Integrations",
  description:
    "Explore OpenUI integrations across AI frameworks and protocols, design systems, and frontend platforms.",
  alternates: { canonical: "/integrations" },
  openGraph: {
    title: "OpenUI integrations",
    description:
      "Build generative UI with the AI frameworks, design systems, and frontend platforms you know.",
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
          <>
            Start with an AI framework, design system, or frontend platform your team already knows.
          </>
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

          <CategoryNav
            categories={integrationCategories.map((category) => ({
              count: getIntegrationsByCategory(category.id).length,
              id: category.id,
              label: category.shortTitle,
            }))}
          />

          <div className={styles.categoryList}>
            {integrationCategories.map((category) => {
              const items = getIntegrationsByCategory(category.id);

              return (
                <section
                  className={styles.categorySection}
                  data-accent={category.accent}
                  id={category.id}
                  key={category.id}
                >
                  <header className={styles.categoryHeader}>
                    <div className={styles.categoryHeading}>
                      <h2>{category.title}</h2>
                      <p>{category.description}</p>
                    </div>
                  </header>

                  <div className={styles.grid}>
                    {items.map((item) => (
                      <Link
                        className={styles.card}
                        href={`/integrations/${item.slug}`}
                        key={item.slug}
                      >
                        <div className={styles.cardHeader}>
                          <IntegrationLogo className={styles.mark} integration={item} />
                          <div className={styles.cardHeaderContent}>
                            <h3 className={styles.cardTitle}>{item.name}</h3>
                            <div className={styles.tags}>
                              <span className={styles.typeTag}>{item.type}</span>
                            </div>
                          </div>
                        </div>
                        <p className={styles.cardDescription}>{item.summary}</p>
                        <div className={styles.cardLinks} aria-hidden="true">
                          <span className={styles.cardLink}>
                            View integration
                            <ArrowRight
                              className={styles.cardLinkArrow}
                              size={14}
                              aria-hidden="true"
                            />
                          </span>
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
              <h2>Contribute an integration</h2>
              <p>If you want to contribute an integration, please raise an issue.</p>
            </div>
            <a
              className={styles.ctaLink}
              href="https://github.com/thesysdev/openui/issues/new/choose"
              rel="noopener noreferrer"
              target="_blank"
            >
              Raise an issue
              <ArrowRight size={16} aria-hidden="true" />
            </a>
          </section>
        </section>
      </div>

      <Footer />
    </main>
  );
}
