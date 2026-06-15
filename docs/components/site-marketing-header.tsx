"use client";

import {
  GitHubIcon,
  GitHubStarButton,
  StarCountBadge,
  useGitHubStarCount,
  type LogoVariant,
} from "@/components/brand-logo";
import { SiteHeaderFrame } from "@/components/site-header";
import { isNavDropdown, PRIMARY_SITE_NAV_ITEMS, SitePrimaryNav } from "@/components/site-primary-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { AnimatePresence, motion } from "motion/react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { useCallback, useEffect, useState, type CSSProperties, type ReactNode } from "react";
import styles from "./site-marketing-header.module.css";

const BUTTON_SHADOW = "0px 1px 3px 0px rgba(22,34,51,0.08), 0px 12px 24px 0px rgba(22,34,51,0.04)";

type ThemeToggleConfig = {
  onToggle?: () => void;
  title?: string;
  ariaLabel?: string;
};

type SiteMarketingHeaderProps = {
  borderMode?: "always" | "scroll";
  extraActions?: ReactNode;
  themeToggle?: ThemeToggleConfig | null;
  brandVariant?: LogoVariant;
};

function HamburgerIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <svg
      className={styles.hamburgerIcon}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {isOpen ? (
        <>
          <path d="M18 6L6 18" />
          <path d="M6 6l12 12" />
        </>
      ) : (
        <>
          <path d="M3 12h18" />
          <path d="M3 6h18" />
          <path d="M3 18h18" />
        </>
      )}
    </svg>
  );
}

function MobileMenu({ starCount, onClose }: { starCount: number | null; onClose: () => void }) {
  const mobileGithubStyle = {
    "--mobile-github-button-shadow": BUTTON_SHADOW,
  } as CSSProperties;

  const leafItems = PRIMARY_SITE_NAV_ITEMS.filter(
    (item): item is Extract<(typeof PRIMARY_SITE_NAV_ITEMS)[number], { href: string }> =>
      !isNavDropdown(item),
  );
  const dropdownSections = PRIMARY_SITE_NAV_ITEMS.filter(isNavDropdown);

  const agentInterface = leafItems.find((item) => item.title === "Agent Interface");
  const otherLeafItems = leafItems.filter((item) => item !== agentInterface);

  const productSection = {
    title: "Product",
    items: [
      { title: "OpenUI", href: "/", newTab: false, badge: undefined as string | undefined },
      ...(agentInterface
        ? [
            {
              title: agentInterface.title,
              href: agentInterface.href,
              newTab: agentInterface.newTab,
              badge: agentInterface.badge,
            },
          ]
        : []),
    ],
  };

  return (
    <>
      <motion.div
        className={styles.mobileBackdrop}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
      />
      <motion.div
        className={styles.mobileTrayWrap}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2 }}
      >
        <div className={styles.mobileTray}>
          <div className={styles.mobileTrayInner}>
            <div className={styles.mobileTraySection}>
              <div className={styles.mobileTraySectionHeading}>{productSection.title}</div>
              {productSection.items.map((entry) => (
                <Link
                  key={entry.href}
                  className={styles.mobileTrayLink}
                  href={entry.href}
                  {...(entry.newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                >
                  <span>{entry.title}</span>
                  {entry.badge && (
                    <span className={styles.mobileTrayBadge}>{entry.badge}</span>
                  )}
                </Link>
              ))}
            </div>

            {otherLeafItems.length > 0 && (
              <div className={styles.mobileTraySection}>
                <div className={styles.mobileTraySectionHeading}>Resources</div>
                {otherLeafItems.map((entry) => (
                  <Link
                    key={entry.href}
                    className={styles.mobileTrayLink}
                    href={entry.href}
                    {...(entry.newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  >
                    <span>{entry.title}</span>
                    {entry.badge && (
                      <span className={styles.mobileTrayBadge}>{entry.badge}</span>
                    )}
                  </Link>
                ))}
              </div>
            )}

            {dropdownSections.map((section) => (
              <div key={section.title} className={styles.mobileTraySection}>
                <div className={styles.mobileTraySectionHeading}>{section.title}</div>
                {section.children.map((child) => (
                  <Link
                    key={child.href}
                    className={styles.mobileTrayLink}
                    href={child.href}
                    {...(child.newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  >
                    <span>{child.title}</span>
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className={styles.mobileGithubButtonWrap}>
          <a
            href="https://github.com/thesysdev/openui"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.mobileGithubButton}
          >
            <div
              aria-hidden="true"
              className={styles.mobileGithubButtonOverlay}
              style={mobileGithubStyle}
            />
            <GitHubIcon />
            <StarCountBadge count={starCount} isHighlighted={false} />
          </a>
        </div>
      </motion.div>
    </>
  );
}

export function SiteMarketingHeader({
  borderMode = "scroll",
  extraActions,
  themeToggle,
  brandVariant,
}: SiteMarketingHeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(borderMode === "always");
  const starCount = useGitHubStarCount("thesysdev/openui");
  const { resolvedTheme } = useTheme();
  const resolvedBrandVariant = brandVariant ?? (resolvedTheme === "dark" ? "dark" : "light");

  useEffect(() => {
    if (borderMode === "always") {
      setIsScrolled(true);
      return;
    }

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [borderMode]);

  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen((prev) => !prev);
  }, []);

  const isBordered = borderMode === "always" || isScrolled;

  return (
    <nav className={styles.nav}>
      <SiteHeaderFrame
        variant="home"
        bordered={isBordered}
        borderColor="var(--openui-border-interactive)"
        dividerColor="var(--openui-border-interactive)"
        brandVariant={resolvedBrandVariant}
        center={<SitePrimaryNav />}
        end={
          <div className={styles.desktopActions}>
            {themeToggle !== null && (
              <ThemeToggle
                onToggle={themeToggle?.onToggle}
                title={themeToggle?.title}
                ariaLabel={themeToggle?.ariaLabel}
              />
            )}
            {extraActions}
            <GitHubStarButton repo="thesysdev/openui" isScrolled={isBordered} />
          </div>
        }
        mobileEnd={
          <button
            className={styles.mobileMenuButton}
            onClick={toggleMobileMenu}
            aria-label="Toggle menu"
          >
            <HamburgerIcon isOpen={isMobileMenuOpen} />
          </button>
        }
      />
      <AnimatePresence>
        {isMobileMenuOpen && <MobileMenu starCount={starCount} onClose={toggleMobileMenu} />}
      </AnimatePresence>
    </nav>
  );
}
