"use client";

import { ClipboardCommandButton } from "@/app/(home)/components/Button/Button";
import { GitHubButton } from "@/app/(home)/components/GitHubButton/GitHubButton";
import trayStyles from "@/components/site-marketing-header.module.css";
import {
  ArrowLeft,
  ArrowLeftRight,
  ArrowRight,
  Check,
  ChevronDown,
  Menu,
  Moon,
  RotateCcw,
  Sun,
  X,
} from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import styles from "../chat-page.module.css";
import { getComparisonPair, type ComparisonPair } from "./chat-types";
import type { ComparisonMode } from "./comparison-mode-controller";
import { useHasMounted } from "./use-has-mounted";

// Same runner set and order as the homepage hero's command dropdown.
const CLI_COMMANDS = [
  { id: "pnpm", runner: "pnpx", command: "pnpx @openuidev/cli@latest create" },
  { id: "bun", runner: "bunx", command: "bunx @openuidev/cli@latest create" },
  { id: "yarn", runner: "yarn dlx", command: "yarn dlx @openuidev/cli@latest create" },
  { id: "npm", runner: "npx", command: "npx @openuidev/cli@latest create" },
] as const;

// Display titles for the pair options, mirroring the panel headings: mode name
// plus a chip for the OpenUI flavor. aria-labels keep the canonical names.
interface PairSide {
  label: string;
  chip?: string;
  chipInverted?: boolean;
}

interface PairTitleDefinition {
  left: PairSide;
  right: PairSide;
}

type FeatureSupport = Readonly<Record<ComparisonMode, boolean>>;

interface ComparisonFeature {
  label: string;
  support: FeatureSupport;
}

interface ComparisonPairMetadata {
  description: string;
  title: PairTitleDefinition;
  features: readonly ComparisonFeature[];
}

const ALL_MODES_SUPPORTED: FeatureSupport = { markdown: true, oss: true, cloud: true };
const OSS_AND_CLOUD_SUPPORTED: FeatureSupport = { markdown: false, oss: true, cloud: true };
const CLOUD_ONLY_SUPPORTED: FeatureSupport = { markdown: false, oss: false, cloud: true };

function comparisonFeature(label: string, support: FeatureSupport): ComparisonFeature {
  return { label, support };
}

const CHARTS_FEATURE = comparisonFeature("Charts and data visualizations", OSS_AND_CLOUD_SUPPORTED);
const INTERACTIVE_FEATURE = comparisonFeature(
  "Interactive forms and actions",
  OSS_AND_CLOUD_SUPPORTED,
);
const STREAMING_FEATURE = comparisonFeature("Progressive streaming", ALL_MODES_SUPPORTED);
const RESPONSIVE_OUTPUT_FEATURE = comparisonFeature("Responsive output", OSS_AND_CLOUD_SUPPORTED);
const STYLING_FEATURE = comparisonFeature("Styling and theming", OSS_AND_CLOUD_SUPPORTED);
const REPORTS_FEATURE = comparisonFeature("Reports and presentations", CLOUD_ONLY_SUPPORTED);

const SHARED_OPENUI_FEATURES = [CHARTS_FEATURE, INTERACTIVE_FEATURE, STREAMING_FEATURE] as const;
const MARKDOWN_OSS_FEATURES = [
  ...SHARED_OPENUI_FEATURES,
  RESPONSIVE_OUTPUT_FEATURE,
  STYLING_FEATURE,
] as const;

const PAIR_METADATA: Record<ComparisonPair, ComparisonPairMetadata> = {
  "markdown-oss": {
    description: "Test an AI app with and without OpenUI",
    title: { left: { label: "Markdown" }, right: { label: "OpenUI", chip: "OSS" } },
    features: MARKDOWN_OSS_FEATURES,
  },
  "oss-cloud": {
    description: "Compare open-source and Cloud responses",
    title: {
      left: { label: "OpenUI", chip: "OSS" },
      right: { label: "OpenUI", chip: "Cloud", chipInverted: true },
    },
    features: [
      ...SHARED_OPENUI_FEATURES,
      REPORTS_FEATURE,
      { label: "Built-in tools", support: CLOUD_ONLY_SUPPORTED },
      { label: "Responsive output by default", support: CLOUD_ONLY_SUPPORTED },
      { label: "Automatic UI error correction", support: CLOUD_ONLY_SUPPORTED },
    ],
  },
  "markdown-cloud": {
    description: "Test an AI app with and without OpenUI Cloud",
    title: {
      left: { label: "Markdown" },
      right: { label: "OpenUI", chip: "Cloud", chipInverted: true },
    },
    features: [...MARKDOWN_OSS_FEATURES, REPORTS_FEATURE],
  },
};

function PairTitle({ pair }: { pair: ComparisonPair }) {
  const { left, right } = PAIR_METADATA[pair].title;
  const side = (part: PairSide) => (
    <>
      {part.label}
      {part.chip ? (
        <span
          className={`${styles.panelChip} ${
            part.chipInverted ? styles.panelChipInverted : ""
          }`.trim()}
        >
          {part.chip}
        </span>
      ) : null}
    </>
  );

  return (
    <span className={styles.pairTitleGroup}>
      <span className={`${styles.pairTitleSide} ${styles.pairTitleSideLeft}`}>{side(left)}</span>
      <span className={styles.pairTitleVs}>vs</span>
      <span className={styles.pairTitleSide}>{side(right)}</span>
    </span>
  );
}

// Shared open/close behavior for the header dropdowns: hover opens (mouse only,
// with a grace delay so the pointer can cross into the menu), click toggles,
// outside pointer-down and Escape close.
function useHeaderDropdown() {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);

  const cancelScheduledClose = () => {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    closeTimeoutRef.current = null;
  };

  const handleHoverOpen = (event: React.PointerEvent) => {
    if (event.pointerType !== "mouse") return;
    cancelScheduledClose();
    setOpen(true);
  };

  const handleHoverClose = (event: React.PointerEvent) => {
    if (event.pointerType !== "mouse") return;
    cancelScheduledClose();
    closeTimeoutRef.current = setTimeout(() => setOpen(false), 160);
  };

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return { open, setOpen, wrapRef, triggerRef, handleHoverOpen, handleHoverClose };
}

// Menu display order, independent of the default comparison pair.
const PAIR_MENU_ORDER: readonly ComparisonPair[] = ["markdown-oss", "markdown-cloud", "oss-cloud"];
const PAIR_MENU_OPTIONS = PAIR_MENU_ORDER.map((pair) => getComparisonPair(pair));

function PairSwitcher({
  pair,
  onPairChange,
}: {
  pair: ComparisonPair;
  onPairChange: (pair: ComparisonPair) => void;
}) {
  const { open, setOpen, wrapRef, triggerRef, handleHoverOpen, handleHoverClose } =
    useHeaderDropdown();
  const active = getComparisonPair(pair);

  return (
    <div
      className={styles.modeControl}
      ref={wrapRef}
      onPointerEnter={handleHoverOpen}
      onPointerLeave={handleHoverClose}
    >
      <button
        type="button"
        ref={triggerRef}
        className={styles.pairTrigger}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Change comparison pair (current: ${active.label})`}
        onClick={() => setOpen((value) => !value)}
      >
        <span>Change</span>
        <ArrowLeftRight size={13} strokeWidth={2} aria-hidden="true" />
      </button>

      <div
        className={`${styles.menuOverlay} ${open ? styles.menuOverlayOpen : ""}`.trim()}
        aria-hidden="true"
      />

      <div className={`${styles.pairMenu} ${open ? styles.pairMenuOpen : ""}`.trim()}>
        <div className={styles.pairMenuCard} role="menu" aria-label="Comparison pair">
          {PAIR_MENU_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              role="menuitemradio"
              aria-checked={option.id === pair}
              className={styles.pairMenuItem}
              onClick={() => {
                onPairChange(option.id);
                setOpen(false);
              }}
            >
              <span className={styles.pairMenuItemTitle}>
                <PairTitle pair={option.id} />
              </span>
              <span className={styles.pairMenuItemDescWrap}>
                <span className={styles.pairMenuItemDesc}>
                  {PAIR_METADATA[option.id].description}
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function BuildForFreeMenu() {
  const { open, setOpen, wrapRef, triggerRef, handleHoverOpen, handleHoverClose } =
    useHeaderDropdown();

  return (
    <div
      className={styles.ctaWrap}
      ref={wrapRef}
      onPointerEnter={handleHoverOpen}
      onPointerLeave={handleHoverClose}
    >
      <button
        type="button"
        ref={triggerRef}
        className={styles.ctaButton}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span>Build for free</span>
        <ArrowRight
          size={15}
          strokeWidth={2}
          aria-hidden="true"
          className={styles.ctaChevron}
          data-open={open}
        />
      </button>

      <div className={`${styles.ctaMenu} ${open ? styles.ctaMenuOpen : ""}`.trim()}>
        <div
          className={styles.ctaMenuCard}
          role="menu"
          aria-label="Copy the setup command for a package manager"
        >
          {CLI_COMMANDS.map((item) => (
            <ClipboardCommandButton
              key={item.id}
              command={item.command}
              className={styles.ctaMenuItem}
              iconContainerClassName={styles.ctaMenuItemIcon}
              copyIconColor="currentColor"
            >
              <span className={styles.ctaMenuItemLabel}>
                <span className={styles.ctaMenuItemRunner}>{item.runner}</span>
                {item.command.slice(item.runner.length)}
              </span>
            </ClipboardCommandButton>
          ))}
        </div>
      </div>
    </div>
  );
}

function SupportIcon({ supported }: { supported: boolean }) {
  return supported ? (
    <Check size={15} strokeWidth={2.25} aria-hidden="true" className={styles.comparisonTick} />
  ) : (
    <X size={15} strokeWidth={2} aria-hidden="true" className={styles.comparisonCross} />
  );
}

function ViewComparisonTray({ pair }: { pair: ComparisonPair }) {
  const { open, setOpen, wrapRef, triggerRef } = useHeaderDropdown();
  const [leftMode, rightMode] = getComparisonPair(pair).modes;
  const { title, features } = PAIR_METADATA[pair];
  const { left, right } = title;

  const columnLabel = (part: PairSide) => (
    <span className={styles.comparisonColumnLabel}>
      {part.chip ? `${part.label} ${part.chip}` : part.label}
    </span>
  );

  return (
    <div className={styles.viewComparison} ref={wrapRef}>
      <div
        className={`${styles.menuOverlay} ${styles.menuOverlayMobileDark} ${
          open ? styles.menuOverlayOpen : ""
        }`.trim()}
        aria-hidden="true"
      />

      <div className={`${styles.comparisonTray} ${open ? styles.comparisonTrayOpen : ""}`.trim()}>
        <div className={styles.comparisonTrayInner}>
          <div className={styles.comparisonTrayCard} aria-label="Feature comparison">
            <div className={`${styles.comparisonRow} ${styles.comparisonHeaderRow}`}>
              {columnLabel(left)}
              <span />
              {columnLabel(right)}
            </div>
            {features.map((feature) => (
              <div key={feature.label} className={styles.comparisonRow}>
                <span className={styles.comparisonIconCell}>
                  <SupportIcon supported={feature.support[leftMode]} />
                </span>
                <span className={styles.comparisonFeature}>{feature.label}</span>
                <span className={styles.comparisonIconCell}>
                  <SupportIcon supported={feature.support[rightMode]} />
                </span>
              </div>
            ))}
            <Link
              href="/docs/agent/getting-started/openui-cloud"
              prefetch={false}
              className={styles.comparisonCta}
            >
              Learn more about OpenUI Cloud
              <ArrowRight size={15} strokeWidth={2} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>

      <button
        type="button"
        ref={triggerRef}
        className={styles.viewComparisonChip}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? "Hide comparison" : "View comparison"}
        <ChevronDown
          size={13}
          strokeWidth={2}
          aria-hidden="true"
          className={styles.trayChevron}
          data-open={open}
        />
      </button>
    </div>
  );
}

// Mobile-only hamburger: pair options, reset + theme, and setup commands.
function MobileMenu({
  pair,
  onPairChange,
  onReset,
}: {
  pair: ComparisonPair;
  onPairChange: (pair: ComparisonPair) => void;
  onReset: () => void;
}) {
  const { open, setOpen, wrapRef, triggerRef } = useHeaderDropdown();
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useHasMounted();
  const isDark = mounted && resolvedTheme === "dark";

  return (
    <div className={styles.mobileMenuWrap} ref={wrapRef}>
      <button
        type="button"
        ref={triggerRef}
        className={styles.mobileMenuButton}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Menu"
        onClick={() => setOpen((value) => !value)}
      >
        {open ? (
          <X size={18} strokeWidth={2} aria-hidden="true" />
        ) : (
          <Menu size={18} strokeWidth={2} aria-hidden="true" />
        )}
      </button>

      {open ? (
        <>
          <div
            className={styles.mobileMenuBackdrop}
            aria-hidden="true"
            onClick={() => setOpen(false)}
          />
          <div className={styles.mobileMenuSheet}>
            <div className={`${trayStyles.mobileTray} ${styles.menuTrayFlush}`}>
              <div className={`${trayStyles.mobileTrayInner} ${styles.menuTrayPad}`}>
                <div className={trayStyles.mobileTraySection} role="menu" aria-label="Comparison">
                  <div className={trayStyles.mobileTraySectionHeading}>Comparison</div>
                  {PAIR_MENU_OPTIONS.map((option) => {
                    const { left, right } = PAIR_METADATA[option.id].title;
                    const sideText = (part: PairSide) =>
                      part.chip ? `${part.label} ${part.chip}` : part.label;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        role="menuitemradio"
                        aria-checked={option.id === pair}
                        className={`${trayStyles.mobileTrayLink} ${styles.menuFlatLink}`}
                        onClick={() => {
                          onPairChange(option.id);
                          setOpen(false);
                        }}
                      >
                        <span className={styles.mobileMenuPairTitle}>
                          {sideText(left)} <span className={styles.pairTitleVs}>vs</span>{" "}
                          {sideText(right)}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className={trayStyles.mobileTraySection}>
                  <div className={trayStyles.mobileTraySectionHeading}>Preferences</div>
                  <button
                    type="button"
                    className={`${trayStyles.mobileTrayLink} ${styles.menuFlatLink}`}
                    onClick={() => {
                      onReset();
                      setOpen(false);
                    }}
                  >
                    <RotateCcw size={15} strokeWidth={2} aria-hidden="true" />
                    <span>Reset chats</span>
                  </button>
                  <button
                    type="button"
                    className={`${trayStyles.mobileTrayLink} ${styles.menuFlatLink}`}
                    onClick={() => setTheme(isDark ? "light" : "dark")}
                  >
                    {isDark ? (
                      <Sun size={15} strokeWidth={2} aria-hidden="true" />
                    ) : (
                      <Moon size={15} strokeWidth={2} aria-hidden="true" />
                    )}
                    <span>{isDark ? "Light mode" : "Dark mode"}</span>
                  </button>
                </div>

                <div className={trayStyles.mobileTrayFooter}>
                  <GitHubButton
                    variant="desktopGlow"
                    compact
                    href="https://github.com/thesysdev/openui"
                    arrow={<ArrowRight size={18} strokeWidth={2} aria-hidden="true" />}
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

interface ChatPageHeaderProps {
  pair: ComparisonPair;
  onPairChange: (pair: ComparisonPair) => void;
  onReset: () => void;
  leftHeading?: ReactNode;
  rightHeading?: ReactNode;
}

export function ChatPageHeader({
  pair,
  onPairChange,
  onReset,
  leftHeading,
  rightHeading,
}: ChatPageHeaderProps) {
  return (
    <header className={styles.header} aria-label="OpenUI chat controls">
      <div className={styles.headerRow}>
        <Link className={styles.backLink} href="/" prefetch={false} aria-label="Back to docs">
          <ArrowLeft aria-hidden="true" size={15} strokeWidth={2} />
        </Link>

        {leftHeading}

        <PairSwitcher pair={pair} onPairChange={onPairChange} />

        {rightHeading}

        <BuildForFreeMenu />

        <MobileMenu pair={pair} onPairChange={onPairChange} onReset={onReset} />
      </div>

      <ViewComparisonTray pair={pair} />
    </header>
  );
}
