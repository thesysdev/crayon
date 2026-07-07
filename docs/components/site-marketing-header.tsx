"use client";

import { type LogoVariant } from "@/components/brand-logo";
import { GitHubButton } from "@/app/(home)/components/GitHubButton/GitHubButton";
import { SiteHeaderFrame } from "@/components/site-header";
import { isNavDropdown, PRIMARY_SITE_NAV_ITEMS, SitePrimaryNav } from "@/components/site-primary-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { ArrowRight } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import styles from "./site-marketing-header.module.css";

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

function MobileMenu({ onClose }: { onClose: () => void }) {
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

  const renderTrayLink = (entry: {
    title: string;
    href: string;
    newTab?: boolean;
    badge?: string;
  }) => (
    <Link
      key={entry.href}
      className={styles.mobileTrayLink}
      href={entry.href}
      {...(entry.newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      <span>{entry.title}</span>
      {entry.badge && <span className={styles.mobileTrayBadge}>{entry.badge}</span>}
    </Link>
  );

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
              {productSection.items.map(renderTrayLink)}
            </div>

            {otherLeafItems.length > 0 && (
              <div className={styles.mobileTraySection}>
                <div className={styles.mobileTraySectionHeading}>Resources</div>
                {otherLeafItems.map(renderTrayLink)}
              </div>
            )}

            {dropdownSections.map((section) => (
              <div key={section.title} className={styles.mobileTraySection}>
                <div className={styles.mobileTraySectionHeading}>{section.title}</div>
                {section.children.map(renderTrayLink)}
              </div>
            ))}

            <div className={styles.mobileTrayFooter}>
              <GitHubButton
                variant="desktopGlow"
                compact
                href="https://github.com/thesysdev/openui"
                arrow={
                  <ArrowRight
                    className={styles.mobileTrayArrow}
                    size={18}
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                }
              />
            </div>
          </div>
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
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const resolvedBrandVariant =
    brandVariant ?? (mounted && resolvedTheme === "dark" ? "dark" : "light");

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
            <GitHubButton
              variant="desktopGlow"
              compact
              href="https://github.com/thesysdev/openui"
            />
          </div>
        }
        mobileEnd={
          <div className={styles.mobileEndActions}>
            {isMobileMenuOpen && themeToggle !== null && (
              <ThemeToggle
                onToggle={themeToggle?.onToggle}
                title={themeToggle?.title}
                ariaLabel={themeToggle?.ariaLabel}
              />
            )}
            <button
              className={styles.mobileMenuButton}
              onClick={toggleMobileMenu}
              aria-label="Toggle menu"
            >
              <HamburgerIcon isOpen={isMobileMenuOpen} />
            </button>
          </div>
        }
      />
      <AnimatePresence>
        {isMobileMenuOpen && <MobileMenu onClose={toggleMobileMenu} />}
      </AnimatePresence>
    </nav>
  );
}
