import { ArrowUpRight } from "lucide-react";
import { BevelButton } from "../components/Button/BevelButton";
import heroStyles from "../sections/HeroSection/HeroSection.module.css";
import cloudStyles from "./page.module.css";

function CloudCtas() {
  return (
    <div className={cloudStyles.ctaGroup}>
      <BevelButton
        href="https://console.thesys.dev/keys"
        external
        variant="primary"
        label="Get API Key"
        badge={<ArrowUpRight size={16} strokeWidth={2.25} />}
      />
      <BevelButton
        href="https://zcal.co/t/thesys/demo"
        external
        variant="secondary"
        label="Get a demo"
        badge={<ArrowUpRight size={16} strokeWidth={2.25} />}
      />
    </div>
  );
}

function CloudTitle() {
  return (
    <span className={cloudStyles.titleBlock}>
      <span className={cloudStyles.eyebrow}>
        OpenUI <span className={cloudStyles.cloudTag}>Cloud</span>
      </span>
      <span className={cloudStyles.title}>API for running OpenUI in Production</span>
    </span>
  );
}

function CloudSubtitle() {
  return (
    <span className={cloudStyles.subtitle}>
      One API for models, fallbacks, validation, rendering, and observability.
    </span>
  );
}

function CloudPreview({ decorative = false }: { decorative?: boolean }) {
  return (
    <picture>
      <source
        data-theme-source
        media="(prefers-color-scheme: dark)"
        type="image/webp"
        srcSet="/openui-cloud/hero-dark-720.webp 720w, /openui-cloud/hero-dark-1280.webp 1280w"
        sizes="(max-width: 767px) calc(100vw - 50px), 1280px"
      />
      <img
        className={cloudStyles.heroImage}
        src="/openui-cloud/hero-light-1280.webp"
        srcSet="/openui-cloud/hero-light-720.webp 720w, /openui-cloud/hero-light-1280.webp 1280w"
        sizes="(max-width: 767px) calc(100vw - 50px), 1280px"
        alt={decorative ? "" : "OpenUI Cloud production interface preview"}
        aria-hidden={decorative || undefined}
        width={1280}
        height={600}
        loading="eager"
        decoding="async"
        fetchPriority="high"
      />
    </picture>
  );
}

export function CloudHero() {
  return (
    <section className={heroStyles.section}>
      <div className={heroStyles.desktopHero}>
        <div
          className={`${heroStyles.desktopHeroInner} ${heroStyles.desktopHeroInnerLeft} ${heroStyles.desktopHeroInnerFlushInline}`}
        >
          <div
            className={`${heroStyles.desktopHeroLockup} ${heroStyles.desktopHeroLockupLeft} ${heroStyles.desktopHeroLockupSplit}`}
          >
            <h1 className={`${heroStyles.desktopTitle} ${heroStyles.desktopTitleLeft}`}>
              <CloudTitle />
            </h1>
            <p
              className={`${heroStyles.desktopSubtitle} ${heroStyles.desktopSubtitleLeft} ${heroStyles.desktopSubtitleSmall}`}
            >
              <CloudSubtitle />
            </p>
          </div>

          <div
            className={`${heroStyles.desktopCtaStack} ${heroStyles.desktopCtaStackShadowRoom} ${heroStyles.desktopCtaStackLeft}`}
          >
            <div className={heroStyles.commandGroup}>
              <CloudCtas />
            </div>
          </div>
        </div>
      </div>

      <div className={heroStyles.mobileHero}>
        <div className={heroStyles.mobileHeroIntro}>
          <div className={heroStyles.mobileHeroStack}>
            <div className={heroStyles.mobileBrandGroup}>
              <h1 className={`${heroStyles.mobileTitle} ${heroStyles.mobileTitleCompact}`}>
                <CloudTitle />
              </h1>
            </div>
            <p className={`${heroStyles.mobileSubtitle} ${heroStyles.mobileSubtitleSmall}`}>
              <CloudSubtitle />
            </p>
          </div>
        </div>

        <div className={heroStyles.mobileCtaStack}>
          <div className={heroStyles.commandGroup}>
            <CloudCtas />
          </div>
        </div>

        <div
          className={`${heroStyles.mobileIllustrationViewport} ${heroStyles.mobileIllustrationViewportSlot}`}
        >
          <CloudPreview />
        </div>
      </div>

      <div className={heroStyles.previewSection}>
        <div className={heroStyles.previewDesktopOnly}>
          <div className={`${heroStyles.previewFrame} ${heroStyles.previewFrameSlot}`}>
            <CloudPreview decorative />
          </div>
        </div>
      </div>
    </section>
  );
}
