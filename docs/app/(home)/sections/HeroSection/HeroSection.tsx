"use client";

import { GitHubIcon } from "@/components/brand-logo";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ClipboardCommandButton, PillLink } from "../../components/Button/Button";
import styles from "./HeroSection.module.css";

export const heroStyles = styles;

// CTAs
const primaryCTA = "npx @openuidev/cli@latest create";
const secondaryCTA = "Try Playground";
const openclawOsHref = "/openclaw-os";
const DESKTOP_HERO_IMAGE = {
  light: "/homepage/hero-web.png",
  dark: "/homepage/hero-web-dark.png",
  width: 2040,
  height: 704,
} as const;
const MOBILE_HERO_IMAGE = {
  light: "/homepage/mobile-hero.png",
  dark: "/homepage/mobile-hero-dark.png",
  width: 804,
  height: 880,
} as const;

type HeroTheme = "light" | "dark";
// ---------------------------------------------------------------------------
// Buttons
// ---------------------------------------------------------------------------

function TrailingArrow() {
  return (
    <ArrowRight aria-hidden="true" className={styles.mobileCtaArrow} size={18} strokeWidth={2} />
  );
}

const COPY_TOAST_MS = 1800;

export function NpmButton({ className = "", command }: { className?: string; command: string }) {
  const [showToast, setShowToast] = useState(false);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  const handleCopyChange = (copied: boolean) => {
    if (!copied) return;
    setShowToast(true);
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = setTimeout(() => {
      setShowToast(false);
    }, COPY_TOAST_MS);
  };

  return (
    <div className={styles.npmButtonWrapper}>
      <ClipboardCommandButton
        command={command}
        className={`${styles.npmButton} ${className}`.trim()}
        iconContainerClassName={styles.npmIconBadge}
        copyIconColor="white"
        onCopyChange={handleCopyChange}
      >
        <span className={styles.npmDesktopLabel}>{command}</span>
        <span className={styles.npmMobileLabel}>
          <span className={styles.npmTicker}>
            <span className={styles.npmTickerText}>{command}</span>
            <span aria-hidden="true" className={styles.npmTickerText}>
              {command}
            </span>
          </span>
        </span>
      </ClipboardCommandButton>
      <div
        className={`${styles.copyToast} ${showToast ? styles.copyToastVisible : ""}`.trim()}
        role="status"
        aria-live="polite"
      >
        Copied. Paste in your terminal to install.
      </div>
    </div>
  );
}

function CommandTabs({
  showSecondaryCommand,
  setShowSecondaryCommand,
  secondaryCommand,
}: {
  showSecondaryCommand: boolean;
  setShowSecondaryCommand: (value: boolean) => void;
  secondaryCommand?: string;
}) {
  if (!secondaryCommand) return null;

  return (
    <div className={styles.commandTabs} role="tablist" aria-label="Install platform">
      <button
        type="button"
        role="tab"
        aria-selected={!showSecondaryCommand}
        className={`${styles.commandTab} ${
          !showSecondaryCommand ? styles.commandTabActive : ""
        }`.trim()}
        onClick={() => setShowSecondaryCommand(false)}
      >
        macOS / Linux
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={showSecondaryCommand}
        className={`${styles.commandTab} ${
          showSecondaryCommand ? styles.commandTabActive : ""
        }`.trim()}
        onClick={() => setShowSecondaryCommand(true)}
      >
        Windows
      </button>
    </div>
  );
}

function DesktopPlaygroundButton({ className = "" }: { className?: string }) {
  return (
    <PillLink
      href="/playground"
      className={`${styles.desktopPlaygroundButton} ${className}`.trim()}
      arrow={<TrailingArrow />}
    >
      <span>{secondaryCTA}</span>
    </PillLink>
  );
}

function MobilePlaygroundButton({ className = "" }: { className?: string }) {
  return (
    <PillLink
      href="/demo/github"
      className={`${styles.mobilePlaygroundButton} ${className}`.trim()}
      arrow={<TrailingArrow />}
    >
      <span className={styles.mobilePlaygroundLabel}>Try Demo</span>
    </PillLink>
  );
}

function DesktopGithubButton({
  href,
  label = "Star us on GitHub",
  className = "",
}: {
  href: string;
  label?: string;
  className?: string;
}) {
  return (
    <PillLink
      href={href}
      external
      className={`${styles.desktopPlaygroundButton} ${className}`.trim()}
      arrow={<TrailingArrow />}
    >
      <span aria-hidden="true" className={styles.heroBannerIcon}>
        <GitHubIcon />
      </span>
      <span>{label}</span>
    </PillLink>
  );
}

function AnnouncementBanner({ className = "" }: { className?: string }) {
  return (
    <>
      <div className={`${styles.heroBanner} ${styles.heroBannerDesktop} ${className}`.trim()}>
        <span className={styles.heroBannerLabel}>
          <span className={styles.heroBannerBadge}>New</span>
          <span>The default workspace for OpenClaw. Meet OpenClaw-OS.</span>
        </span>
        <div className={styles.heroBannerActions}>
          <Link
            href={openclawOsHref}
            className={`${styles.heroBannerButton} ${styles.heroBannerButtonPrimary}`}
          >
            <span>Meet OpenClaw-OS</span>
          </Link>
        </div>
      </div>
      <Link
        href={openclawOsHref}
        className={`${styles.heroBanner} ${styles.heroBannerMobile} ${className}`.trim()}
      >
        <span className={styles.heroBannerLabel}>
          <span className={styles.heroBannerBadge}>New</span>
          <span>Meet OpenClaw-OS</span>
        </span>
      </Link>
    </>
  );
}

function GitHubBanner({
  href = "https://github.com/thesysdev/openui",
  label = "Star us on Github",
  className = "",
}: {
  href?: string;
  label?: string;
  className?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`${styles.heroBanner} ${styles.mobileGithubButton} ${className}`.trim()}
    >
      <span className={styles.heroBannerLead}>
        <span aria-hidden="true" className={styles.heroBannerIcon}>
          <GitHubIcon />
        </span>
        <span>{label}</span>
      </span>
      <TrailingArrow />
    </a>
  );
}

// ---------------------------------------------------------------------------
// Desktop hero
// ---------------------------------------------------------------------------

function DesktopHero({
  title,
  subtitle,
  command,
  commandLabel,
  secondaryCommand,
  secondaryCommandLabel,
  compact,
  showBanner,
  showPlaygroundButton,
  githubRepoUrl,
  githubButtonLabel,
}: {
  title: ReactNode;
  subtitle: ReactNode;
  command: string;
  commandLabel?: string;
  secondaryCommand?: string;
  secondaryCommandLabel?: string;
  compact: boolean;
  showBanner: boolean;
  showPlaygroundButton: boolean;
  githubRepoUrl?: string;
  githubButtonLabel?: string;
}) {
  // The shadow-room class compensates for the absent secondary CTA — only
  // applied when both the playground button AND the GitHub button are off.
  const hasSecondaryCta = showPlaygroundButton || !!githubRepoUrl;
  const [showSecondaryCommand, setShowSecondaryCommand] = useState(false);

  return (
    <div className={styles.desktopHero}>
      <div className={styles.desktopHeroInner}>
        <div className={styles.desktopHeroLockup}>
          {showBanner && <AnnouncementBanner />}
          <h1
            className={`${styles.desktopTitle} ${compact ? styles.desktopTitleCompact : ""}`.trim()}
          >
            {title}
          </h1>
          <p className={styles.desktopSubtitle}>{subtitle}</p>
        </div>

        <div
          className={`${styles.desktopCtaStack} ${
            !hasSecondaryCta ? styles.desktopCtaStackShadowRoom : ""
          }`.trim()}
        >
          <div className={styles.commandGroup}>
            <CommandTabs
              showSecondaryCommand={showSecondaryCommand}
              setShowSecondaryCommand={setShowSecondaryCommand}
              secondaryCommand={secondaryCommand}
            />
            <div className={styles.commandItem}>
              <NpmButton
                command={showSecondaryCommand && secondaryCommand ? secondaryCommand : command}
              />
            </div>
          </div>
          {showPlaygroundButton && <DesktopPlaygroundButton />}
          {githubRepoUrl && <DesktopGithubButton href={githubRepoUrl} label={githubButtonLabel} />}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mobile hero
// ---------------------------------------------------------------------------

function MobileHero({
  theme,
  title,
  subtitle,
  command,
  commandLabel,
  secondaryCommand,
  secondaryCommandLabel,
  compact,
  showBanner,
  showPlaygroundButton,
  showGitHubBanner,
  githubRepoUrl,
  mobileImageOverride,
  mobileImageAlt,
  mobileImageWidth,
  mobileImageHeight,
  mobileImageCropTopPercent = 0,
}: {
  theme: HeroTheme;
  title: ReactNode;
  subtitle: ReactNode;
  command: string;
  commandLabel?: string;
  secondaryCommand?: string;
  secondaryCommandLabel?: string;
  compact: boolean;
  showBanner: boolean;
  showPlaygroundButton: boolean;
  showGitHubBanner: boolean;
  githubRepoUrl?: string;
  mobileImageOverride?: string;
  mobileImageAlt?: string;
  mobileImageWidth?: number;
  mobileImageHeight?: number;
  mobileImageCropTopPercent?: number;
}) {
  const [showSecondaryCommand, setShowSecondaryCommand] = useState(false);
  const mobileHeroImage =
    mobileImageOverride ?? (theme === "dark" ? MOBILE_HERO_IMAGE.dark : MOBILE_HERO_IMAGE.light);

  const naturalWidth = mobileImageWidth ?? MOBILE_HERO_IMAGE.width;
  const naturalHeight = mobileImageHeight ?? MOBILE_HERO_IMAGE.height;
  const cropTop = Math.max(0, Math.min(100, mobileImageCropTopPercent));
  const cropped = cropTop > 0;
  const viewportStyle = cropped
    ? { aspectRatio: `${naturalWidth} / ${naturalHeight * (1 - cropTop / 100)}` }
    : undefined;
  const imageStyle = cropped
    ? ({ height: "100%", objectFit: "cover", objectPosition: "bottom" } as const)
    : undefined;

  return (
    <div className={styles.mobileHero}>
      <div className={styles.mobileHeroIntro}>
        <div className={styles.mobileHeroStack}>
          {showBanner && <AnnouncementBanner />}

          <div className={styles.mobileBrandGroup}>
            <p
              className={`${styles.mobileTitle} ${compact ? styles.mobileTitleCompact : ""}`.trim()}
            >
              {title}
            </p>
          </div>

          {/* Subtitle */}
          <p className={styles.mobileSubtitle}>{subtitle}</p>
        </div>
      </div>

      {/* CTA buttons */}
      <div className={styles.mobileCtaStack}>
        <div className={styles.commandGroup}>
          <CommandTabs
            showSecondaryCommand={showSecondaryCommand}
            setShowSecondaryCommand={setShowSecondaryCommand}
            secondaryCommand={secondaryCommand}
          />
          <div className={styles.commandItem}>
            <NpmButton
              className={styles.mobileCtaButtonWidth}
              command={showSecondaryCommand && secondaryCommand ? secondaryCommand : command}
            />
          </div>
        </div>
        {showPlaygroundButton && <MobilePlaygroundButton className={styles.mobileCtaButtonWidth} />}
        {showGitHubBanner && (
          <GitHubBanner href={githubRepoUrl} className={styles.mobileCtaButtonWidth} />
        )}
      </div>

      {/* Mobile hero image */}
      <div className={styles.mobileIllustrationViewport} style={viewportStyle}>
        <img
          src={mobileHeroImage}
          alt={mobileImageAlt ?? "OpenUI mobile hero preview"}
          width={naturalWidth}
          height={naturalHeight}
          className={styles.mobileIllustrationImage}
          style={imageStyle}
          loading="eager"
          decoding="async"
          fetchPriority="high"
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Desktop preview image
// ---------------------------------------------------------------------------

function PreviewImage({
  theme,
  desktopImageOverride,
  desktopImageAlt,
  desktopImageWidth,
  desktopImageHeight,
  widePreview,
}: {
  theme: HeroTheme;
  desktopImageOverride?: string;
  desktopImageAlt?: string;
  desktopImageWidth?: number;
  desktopImageHeight?: number;
  widePreview?: boolean;
}) {
  const desktopHeroImage =
    desktopImageOverride ?? (theme === "dark" ? DESKTOP_HERO_IMAGE.dark : DESKTOP_HERO_IMAGE.light);

  return (
    <div
      className={`${styles.previewSection} ${widePreview ? styles.previewSectionTight : ""}`.trim()}
    >
      <div className={styles.previewDesktopOnly}>
        <div
          className={`${styles.previewFrame} ${widePreview ? styles.previewFrameWide : ""}`.trim()}
        >
          <img
            src={desktopHeroImage}
            alt={desktopImageAlt ?? "OpenUI desktop hero preview"}
            width={desktopImageWidth ?? DESKTOP_HERO_IMAGE.width}
            height={desktopImageHeight ?? DESKTOP_HERO_IMAGE.height}
            className={styles.previewImage}
            loading="eager"
            decoding="async"
            fetchPriority="high"
          />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tagline
// ---------------------------------------------------------------------------

function Tagline({ children, compact }: { children?: ReactNode; compact?: boolean }) {
  return (
    <div className={styles.taglineSection}>
      <div className={styles.taglineContainer}>
        <p className={`${styles.tagline} ${compact ? styles.taglineCompact : ""}`.trim()}>
          {children ?? (
            <>
              An open source toolkit to make your <br className={styles.taglineBreak} />
              AI apps respond with your UI.
            </>
          )}
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function HeroSection({
  title = "OpenUI",
  subtitle = "The Open Standard for Generative UI",
  command = primaryCTA,
  commandLabel,
  secondaryCommand,
  secondaryCommandLabel,
  compact = false,
  showBanner = true,
  showPlaygroundButton = true,
  desktopPreviewImage,
  desktopPreviewImageAlt,
  desktopPreviewImageWidth,
  desktopPreviewImageHeight,
  widePreview = false,
  showTagline = true,
  tagline,
  taglineCompact = false,
  showGitHubBanner = true,
  githubRepoUrl,
  githubButtonLabel,
  mobilePreviewImage,
  mobilePreviewImageAlt,
  mobilePreviewImageWidth,
  mobilePreviewImageHeight,
  mobilePreviewImageCropTopPercent,
}: {
  title?: ReactNode;
  subtitle?: ReactNode;
  command?: string;
  commandLabel?: string;
  secondaryCommand?: string;
  secondaryCommandLabel?: string;
  compact?: boolean;
  showBanner?: boolean;
  showPlaygroundButton?: boolean;
  desktopPreviewImage?: string;
  desktopPreviewImageAlt?: string;
  desktopPreviewImageWidth?: number;
  desktopPreviewImageHeight?: number;
  widePreview?: boolean;
  showTagline?: boolean;
  tagline?: ReactNode;
  taglineCompact?: boolean;
  showGitHubBanner?: boolean;
  /** When set, adds a desktop GitHub PillLink CTA pointing here AND uses
   *  this URL for the mobile GitHub banner (instead of the default openui
   *  repo). Useful for sub-product pages like /openclaw-os. */
  githubRepoUrl?: string;
  /** Optional override for the desktop GitHub button label (default: "Star on GitHub"). */
  githubButtonLabel?: string;
  mobilePreviewImage?: string;
  mobilePreviewImageAlt?: string;
  mobilePreviewImageWidth?: number;
  mobilePreviewImageHeight?: number;
  mobilePreviewImageCropTopPercent?: number;
} = {}) {
  const theme: HeroTheme = "light";

  return (
    <section className={styles.section}>
      <DesktopHero
        title={title}
        subtitle={subtitle}
        command={command}
        commandLabel={commandLabel}
        secondaryCommand={secondaryCommand}
        secondaryCommandLabel={secondaryCommandLabel}
        compact={compact}
        showBanner={showBanner}
        showPlaygroundButton={showPlaygroundButton}
        githubRepoUrl={githubRepoUrl}
        githubButtonLabel={githubButtonLabel}
      />
      <MobileHero
        theme={theme}
        title={title}
        subtitle={subtitle}
        command={command}
        commandLabel={commandLabel}
        secondaryCommand={secondaryCommand}
        secondaryCommandLabel={secondaryCommandLabel}
        compact={compact}
        showBanner={showBanner}
        showPlaygroundButton={showPlaygroundButton}
        showGitHubBanner={showGitHubBanner}
        githubRepoUrl={githubRepoUrl}
        mobileImageOverride={mobilePreviewImage}
        mobileImageAlt={mobilePreviewImageAlt}
        mobileImageWidth={mobilePreviewImageWidth}
        mobileImageHeight={mobilePreviewImageHeight}
        mobileImageCropTopPercent={mobilePreviewImageCropTopPercent}
      />
      <PreviewImage
        theme={theme}
        desktopImageOverride={desktopPreviewImage}
        desktopImageAlt={desktopPreviewImageAlt}
        desktopImageWidth={desktopPreviewImageWidth}
        desktopImageHeight={desktopPreviewImageHeight}
        widePreview={widePreview}
      />
      {showTagline && <Tagline compact={taglineCompact}>{tagline}</Tagline>}
    </section>
  );
}
