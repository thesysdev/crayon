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

type CommandPlatform = "macos" | "linux" | "windows";

function AppleLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 814 1000" fill="currentColor" aria-hidden="true">
      <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105.6-57-155.5-127C46.7 790.7 0 663 0 541.8c0-194.4 126.4-297.5 250.8-297.5 66.1 0 121.2 43.4 162.7 43.4 39.5 0 101.1-46 176.3-46 28.5 0 130.9 2.6 198.3 99.2zm-234-181.5c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z" />
    </svg>
  );
}

function LinuxLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="50 5 165 145" fill="currentColor" aria-hidden="true">
      <path d="M128.6640625 79.2793c0 1-1 1-1 1h-1c-1 0-1-1-2-2 0 0-1-1-1-2s0-1 1-1l2 1c1 1 2 2 2 3m-18-10c0-5-2-8-5-8 0 0 0 1-1 1v2h3c0 2 1 3 1 5h2m35-5c2 0 3 2 4 5h2c-1-1-1-2-1-3s0-2-1-3-2-2-3-2c0 0-1 1-2 1 0 1 1 1 1 2m-30 16c-1 0-1 0-1-1s0-2 1-3c2 0 3-1 3-1 1 0 1 1 1 1 0 1-1 2-3 4h-1m-11-1c-4-2-5-5-5-10 0-3 0-5 2-7 1-2 3-3 5-3s3 1 5 3c1 3 2 6 2 9v2h1v-1c1 0 1-2 1-6 0-3 0-6-2-9s-4-5-8-5c-3 0-6 2-7 5-2 4-2.4 7-2.4 12 0 4 1.4 8 5.4 12 1-1 2-1 3-2m125 141c1 0 1-.4 1-1.3 0-2.2-1-4.8-4-7.7-3-3-8-4.9-14-5.7-1-.1-2-.1-2-.1-1-.2-1-.2-2-.2-1-.1-3-.3-4-.5 3-9.3 4-17.5 4-24.7 0-10-2-17-6-23s-8-9-13-10c-1 1-1 1-1 2 5 2 10 6 13 12 3 7 4 13 4 20 0 5.6-1 13.9-5 24.5-4 1.6-8 5.3-11 11.1 0 .9 0 1.4 1 1.4 0 0 1-.9 2-2.6 2-1.7 3-3.4 5-5.1 3-1.7 5-2.6 8-2.6 5 0 10 .7 13 2.1 4 1.3 6 2.7 7 4.3 1 1.5 2 2.9 3 4.2 0 1.3 1 1.9 1 1.9m-92-145c-1-1-1-3-1-5 0-4 0-6 2-9 2-2 4-3 6-3 3 0 5 2 7 4 1 3 2 5 2 8 0 5-2 8-6 9 0 0 1 1 2 1 2 0 3 1 5 2 1-6 2-10 2-15 0-6-1-10-3-13-3-3-6-4-10-4-3 0-6 1-9 3-2 3-3 5-3 8 0 5 1 9 3 13 1 0 2 1 3 1m12 16c-13 9-23 13-31 13-7 0-14-3-20-8 1 2 2 4 3 5l6 6c4 4 9 6 14 6 7 0 15-4 25-11l9-6c2-2 4-4 4-7 0-1 0-2-1-2-1-2-6-5-16-8-9-4-16-6-20-6-3 0-8 2-15 6-6 4-10 8-10 12 0 0 1 1 2 3 6 5 12 8 18 8 8 0 18-4 31-14v2c1 0 1 1 1 1m23 202c4 7.52 11 11.3 19 11.3 2 0 4-.3 6-.9 2-.4 4-1.1 5-1.9 1-.7 2-1.4 3-2.2 2-.7 2-1.2 3-1.7l17-14.7c4-3.19 8-5.98 13-8.4 4-2.4 8-4 10-4.9 3-.8 5-2 7-3.6 1-1.5 2-3.4 2-5.8 0-2.9-2-5.1-4-6.7s-4-2.7-6-3.4-4-2.3-7-5c-2-2.6-4-6.2-5-10.9l-1-5.8c-1-2.7-1-4.7-2-5.8 0-.3 0-.4-1-.4s-3 .9-4 2.6c-2 1.7-4 3.6-6 5.6-1 2-4 3.8-6 5.5-3 1.7-6 2.6-8 2.6-8 0-12-2.2-15-6.5-2-3.2-3-6.9-4-11.1-2-1.7-3-2.6-5-2.6-5 0-7 5.2-7 15.7v31.1c0 .9-1 2.9-1 6-1 3.1-1 6.62-1 10.6l-2 11.1v.17m-145-5.29c9.3 1.36 20 4.27 32.1 8.71 12.1 4.4 19.5 6.7 22.2 6.7 7 0 12.8-3.1 17.6-9.09 1-1.94 1-4.22 1-6.84 0-9.45-5.7-21.4-17.1-35.9l-6.8-9.1c-1.4-1.9-3.1-4.8-5.3-8.7-2.1-3.9-4-6.9-5.5-9-1.3-2.3-3.4-4.6-6.1-6.9-2.6-2.3-5.6-3.8-8.9-4.6-4.2.8-7.1 2.2-8.5 4.1s-2.2 4-2.4 6.2c-.3 2.1-.9 3.5-1.9 4.2-1 .6-2.7 1.1-5 1.6-.5 0-1.4 0-2.7.1h-2.7c-5.3 0-8.9.6-10.8 1.6-2.5 2.9-3.8 6.2-3.8 9.7 0 1.6.4 4.3 1.2 8.1.8 3.7 1.2 6.7 1.2 8.8 0 4.1-1.2 8.2-3.7 12.3-2.5 4.3-3.8 7.5-3.8 9.78 1 3.88 7.6 6.61 19.7 8.21m33.3-90.9c0-6.9 1.8-14.5 5.5-23.5 3.6-9 7.2-15 10.7-19-.2-1-.7-1-1.5-1l-1-1c-2.9 3-6.4 10-10.6 20-4.2 9-6.4 17.3-6.4 23.4 0 4.5 1.1 8.4 3.1 11.8 2.2 3.3 7.5 8.1 15.9 14.2l10.6 6.9c11.3 9.8 17.3 16.6 17.3 20.6 0 2.1-1 4.2-4 6.5-2 2.4-4.7 3.6-7 3.6-.2 0-.3.2-.3.7 0 .1 1 2.1 3.1 6 4.2 5.7 13.2 8.5 25.2 8.5 22 0 39-9 52-27 0-5 0-8.1-1-9.4v-3.7c0-6.5 1-11.4 3-14.6s4-4.7 7-4.7c2 0 4 .7 6 2.2 1-7.7 1-14.4 1-20.4 0-9.1 0-16.6-2-23.6-1-6-3-11-5-15l-6-9c-2-3-3-6-5-9-1-4-2-7-2-12-3-5-5-10-8-15-2-5-4-10-6-14l-9 7c-10 7-18 10-25 10-6 0-11-1-14-5l-6-5c0 3-1 7-3 11l-6.3 12c-2.8 7-4.3 11-4.6 14-.4 2-.7 4-.9 4l-7.5 15c-8.1 15-12.2 28.9-12.2 40.4 0 2.3.2 4.7.6 7.1-4.5-3.1-6.7-7.4-6.7-13m71.6 94.6c-13 0-23 1.76-30 5.25v-.3c-5 6-10.6 9.1-18.4 9.1-4.9 0-12.6-1.9-23-5.7-10.5-3.6-19.8-6.36-27.9-8.18-.8-.23-2.6-.57-5.5-1.03-2.8-.45-5.4-.91-7.7-1.37-2.1-.45-4.5-1.13-7.1-2.05-2.5-.79-4.5-1.82-6-3.07-1.38-1.26-2.06-2.68-2.06-4.27 0-1.6.34-3.31 1.02-5.13.64-1.1 1.34-2.2 2.04-3.2.7-1.1 1.3-2.1 1.7-3.1.6-.9 1-1.8 1.4-2.8.4-.9.8-1.8 1-2.9.2-1 .4-2 .4-3s-.4-4-1.2-9.3c-.8-5.2-1.2-8.5-1.2-9.9 0-4.4 1-7.9 3.2-10.4s4.3-3.8 6.5-3.8h11.5c.9 0 2.3-.5 4.4-1.7.7-1.6 1.3-2.9 1.7-4.1.5-1.2.7-2.1.9-2.5.2-.6.4-1.2.6-1.7.4-.7.9-1.5 1.6-2.3-.8-1-1.2-2.3-1.2-3.9 0-1.1 0-2.1.2-2.7 0-3.6 1.7-8.7 5.3-15.4l3.5-6.3c2.9-5.4 5.1-9.4 6.7-13.4 1.7-4 3.5-10 5.5-18 1.6-7 5.4-14 11.4-21l7.5-9c5.2-6 8.6-11 10.5-15s2.9-9 2.9-13c0-2-.5-8-1.6-18-1-10-1.5-20-1.5-29 0-7 .6-12 1.9-17s3.6-10 7-14c3-4 7-8 13-10s13-3 21-3c3 0 6 0 9 1 3 0 7 1 12 3 4 2 8 4 11 7 4 3 7 8 10 13 2 6 4 12 5 20 1 5 1 10 2 17 0 6 1 10 1 13 1 3 1 7 2 12 1 4 2 8 4 11 2 4 4 8 7 12 3 5 7 10 11 16 9 10 16 21 20 32 5 10 8 23 8 36.9 0 6.9-1 13.6-3 20.1 2 0 3 .8 4 2.2s2 4.4 3 9.1l1 7.4c1 2.2 2 4.3 5 6.1 2 1.8 4 3.3 7 4.5 2 1 5 2.4 7 4.2 2 2 3 4.1 3 6.3 0 3.4-1 5.9-3 7.7-2 2-4 3.4-7 4.3-2 1-6 3-12 5.82-5 2.96-10 6.55-15 10.8l-10 8.51c-4 3.9-8 6.7-11 8.4-3 1.8-7 2.7-11 2.7l-7-.8c-8-2.1-13-6.1-16-12.2-16-1.94-29-2.9-37-2.9" />
    </svg>
  );
}

function WindowsLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 88 88" fill="currentColor" aria-hidden="true">
      <path d="M0 12.402l35.687-4.86.016 34.423-35.67.203zm35.67 33.529l.028 34.453L.028 75.48.026 45.7zm4.326-39.025L87.314 0v41.527l-47.318.376zm47.329 39.349l-.011 41.34-47.318-6.678-.066-34.739z" />
    </svg>
  );
}

const PLATFORMS: { id: CommandPlatform; label: string; Logo: (props: { className?: string }) => React.JSX.Element }[] = [
  { id: "macos", label: "macOS", Logo: AppleLogo },
  { id: "linux", label: "Linux", Logo: LinuxLogo },
  { id: "windows", label: "Windows", Logo: WindowsLogo },
];

function CommandTabs({
  platform,
  setPlatform,
  secondaryCommand,
}: {
  platform: CommandPlatform;
  setPlatform: (value: CommandPlatform) => void;
  secondaryCommand?: string;
}) {
  if (!secondaryCommand) return null;

  return (
    <div className={styles.commandTabs} role="tablist" aria-label="Install platform">
      {PLATFORMS.map(({ id, label, Logo }) => {
        const isActive = platform === id;
        return (
          <button
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-label={label}
            title={label}
            className={`${styles.commandTab} ${isActive ? styles.commandTabActive : ""}`.trim()}
            onClick={() => setPlatform(id)}
            key={id}
          >
            <Logo className={styles.commandTabIcon} />
          </button>
        );
      })}
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

export function DesktopGithubButton({
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
    <Link
      href="/agent-interface"
      className={`${styles.heroBanner} ${className}`.trim()}
    >
      <span className={styles.heroBannerLabel}>
        <span>Start with a production-ready interface</span>
      </span>
      <span
        aria-hidden="true"
        className={`${styles.heroBannerButton} ${styles.heroBannerButtonPrimary}`}
      >
        <ArrowRight size={14} strokeWidth={2} />
      </span>
    </Link>
  );
}

export function GitHubBanner({
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
  const [platform, setPlatform] = useState<CommandPlatform>("macos");
  const activeCommand = platform === "windows" && secondaryCommand ? secondaryCommand : command;

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
            {secondaryCommand ? (
              <div className={styles.commandUnit}>
                <CommandTabs
                  platform={platform}
                  setPlatform={setPlatform}
                  secondaryCommand={secondaryCommand}
                />
                <div className={styles.commandItem}>
                  <NpmButton command={activeCommand} />
                </div>
              </div>
            ) : (
              <div className={styles.commandItem}>
                <NpmButton command={activeCommand} />
              </div>
            )}
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
  const [platform, setPlatform] = useState<CommandPlatform>("macos");
  const activeCommand = platform === "windows" && secondaryCommand ? secondaryCommand : command;
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
            platform={platform}
            setPlatform={setPlatform}
            secondaryCommand={secondaryCommand}
          />
          <div className={styles.commandItem}>
            <NpmButton className={styles.mobileCtaButtonWidth} command={activeCommand} />
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

export function Tagline({ children, compact }: { children?: ReactNode; compact?: boolean }) {
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
