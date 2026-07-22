"use client";

import { ArrowRight } from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef, useState } from "react";
import styles from "./site-primary-nav.module.css";

type NavLeaf = {
  title: string;
  href: string;
  newTab?: boolean;
  badge?: string;
};

type NavDropdownChild = {
  title: string;
  href: string;
  description?: string;
  newTab?: boolean;
  /* Preview art shown above the label in the desktop mega-menu, exported at 2x
     from the menu design's own frames. Decorative — the adjacent title already
     names the destination. */
  preview?: { light: string; dark: string };
};

type NavDropdown = {
  title: string;
  children: NavDropdownChild[];
};

export type NavItem = NavLeaf | NavDropdown;

export const PRIMARY_SITE_NAV_ITEMS: NavItem[] = [
  { title: "Docs", href: "/docs", newTab: false },
  {
    // Order and titles follow the menu design (Figma node 756:545).
    title: "Demos",
    children: [
      {
        title: "Compare",
        description: "See how AI apps look with and without OpenUI.",
        href: "/compare",
        preview: {
          light: "/nav/compare-light.webp",
          dark: "/nav/compare-dark.webp",
        },
      },
      {
        title: "Dashboard example",
        description: "A demo built on GitHub data that responds with dashboard.",
        href: "/demo/github",
        preview: {
          light: "/nav/dashboard-light.webp",
          dark: "/nav/dashboard-dark.webp",
        },
      },
      {
        title: "OpenUI Chat",
        description: "A ChatGPT-like assistant powered by OpenUI that responds with UI.",
        href: "/chat",
        preview: {
          light: "/nav/chat-light.webp",
          dark: "/nav/chat-dark.webp",
        },
      },
      {
        title: "OpenUI vs JSON",
        description: "See how OpenUI runs 3x faster on 67% fewer tokens.",
        href: "/demos",
        preview: {
          light: "/nav/vsjson-light.webp",
          dark: "/nav/vsjson-dark.webp",
        },
      },
    ],
  },
  {
    title: "Lab",
    children: [
      {
        title: "OpenClaw OS",
        description: "Workspace for your OpenClaw agents.",
        href: "/openclaw-os",
        preview: {
          light: "/nav/openclaw-light.webp",
          dark: "/nav/openclaw-dark.webp",
        },
      },
      {
        title: "Community projects",
        description: "Tools, packages, plugins, and examples",
        href: "/lab",
        preview: {
          light: "/nav/community-light.webp",
          dark: "/nav/community-dark.webp",
        },
      },
    ],
  },
  // Temporarily hidden — Agent Interface isn't ready to share yet. Restore when ready:
  // { title: "Agent Interface", href: "/agent-interface", newTab: false, badge: "New" },
  { title: "Blogs", href: "/blog", newTab: false },
];

export function isNavDropdown(item: NavItem): item is NavDropdown {
  return "children" in item;
}

/* Panel geometry, mirrored from .viewportContent in the stylesheet. Kept in
   sync by hand because the natural width has to be known before layout. */
const CARD_TRACK = 292;
const PANEL_GAP = 8;
const PANEL_PADDING = 12;
/* Smallest gap left between the panel and either edge of the window. */
const VIEWPORT_MARGIN = 16;

function DropdownCard({ child, onNavigate }: { child: NavDropdownChild; onNavigate: () => void }) {
  return (
    <Link
      className={styles.dropdownItem}
      href={child.href}
      role="menuitem"
      onClick={onNavigate}
      {...(child.newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {child.preview && (
        <span className={styles.dropdownPreview}>
          {/* Both variants render; CSS reveals the one matching the theme, so
              there's no hydration flash on first paint. */}
          <img
            src={child.preview.light}
            alt=""
            aria-hidden="true"
            width={852}
            height={480}
            loading="lazy"
            draggable={false}
            className={`${styles.dropdownPreviewImage} ${styles.dropdownPreviewLight}`}
          />
          <img
            src={child.preview.dark}
            alt=""
            aria-hidden="true"
            width={852}
            height={480}
            loading="lazy"
            draggable={false}
            className={`${styles.dropdownPreviewImage} ${styles.dropdownPreviewDark}`}
          />
        </span>
      )}
      <span className={styles.dropdownText}>
        <span className={styles.dropdownTitleRow}>
          <span className={styles.dropdownTitle}>{child.title}</span>
          <span className={styles.dropdownArrow} aria-hidden="true">
            <ArrowRight size={18} />
          </span>
        </span>
        {child.description && (
          <span className={styles.dropdownDescription}>{child.description}</span>
        )}
      </span>
    </Link>
  );
}

/**
 * The dropdowns share a single panel ("viewport") so that moving between two
 * menus morphs one box — it slides to the new trigger and resizes to the new
 * content — instead of cross-fading two separate panels. Every menu's content
 * is always mounted (inert when inactive) so the box can be measured before it
 * animates, and so the artwork isn't re-fetched on each open.
 *
 * The box's geometry is written straight to the DOM rather than held in state:
 * it's derived from measurements that only exist after layout, and round-tripping
 * it through React would cost an extra render on every hover.
 */
export function SitePrimaryNav() {
  const pathname = usePathname();
  const dropdowns = PRIMARY_SITE_NAV_ITEMS.filter(isNavDropdown);

  const [active, setActive] = useState<string | null>(null);

  // Close on navigation. The link's own onClick covers the common case, but a
  // route change can also come from elsewhere (back/forward, a nested link), and
  // the pointer often never leaves the nav, so nothing else would close it.
  // Adjusting state during render is React's sanctioned pattern here — an effect
  // would paint the stale open menu for a frame first.
  const [navigatedFrom, setNavigatedFrom] = useState(pathname);
  if (pathname !== navigatedFrom) {
    setNavigatedFrom(pathname);
    setActive(null);
  }

  const navRef = useRef<HTMLElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const triggerRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const contentRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const wasOpenRef = useRef(false);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    if (!active) {
      viewport.classList.remove(styles.viewportMorph);
      wasOpenRef.current = false;
      return;
    }

    const content = contentRefs.current[active];
    const trigger = triggerRefs.current[active];
    const nav = navRef.current;
    if (!content || !trigger || !nav) return;

    const place = () => {
      const navRect = nav.getBoundingClientRect();
      const triggerRect = trigger.getBoundingClientRect();
      const viewportWidth = document.documentElement.clientWidth;

      // Natural width is arithmetic, not measured: measuring would need the
      // content laid out unconstrained first, and it can't be — its columns are
      // sized from the width set below.
      const columns = content.children.length;
      const natural = PANEL_PADDING * 2 + columns * CARD_TRACK + PANEL_GAP * (columns - 1);
      const width = Math.min(natural, viewportWidth - VIEWPORT_MARGIN * 2);

      // Set the width first so the cards reflow, then read the height they
      // settled at — narrower columns wrap the descriptions onto more lines.
      content.style.width = `${width}px`;
      const height = content.offsetHeight;

      // Centre on the trigger, then push back inside the viewport if that would
      // hang the panel off either edge. Once the panel is as wide as the space
      // allows, both clamps meet and it sits centred on screen.
      const centredOnTrigger = triggerRect.left + triggerRect.width / 2 - width / 2;
      const left = Math.min(
        Math.max(centredOnTrigger, VIEWPORT_MARGIN),
        viewportWidth - width - VIEWPORT_MARGIN,
      );

      viewport.style.width = `${width}px`;
      viewport.style.height = `${height}px`;
      viewport.style.translate = `${left - navRect.left}px 0`;
    };

    const openingFromClosed = !wasOpenRef.current;
    // Opening from closed must not animate — the box would otherwise grow from
    // whatever geometry the previously-open menu left behind.
    if (openingFromClosed) viewport.classList.remove(styles.viewportMorph);

    place();

    // Keep it inside the viewport if the window changes while the menu is open.
    window.addEventListener("resize", place);

    if (openingFromClosed) {
      // Flush the geometry above while transitions are still disarmed, then arm
      // them for subsequent menu switches. Reading a layout property forces the
      // style recalc synchronously, so this needs no rAF — which matters because
      // rAF doesn't fire in a backgrounded tab and would leave the morph unarmed.
      void viewport.offsetWidth;
      viewport.classList.add(styles.viewportMorph);
      wasOpenRef.current = true;
    }

    return () => window.removeEventListener("resize", place);
  }, [active]);

  const close = () => setActive(null);

  return (
    <nav
      className={styles.nav}
      ref={navRef}
      onPointerLeave={close}
      onKeyDown={(event) => {
        if (event.key === "Escape") close();
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) close();
      }}
    >
      {PRIMARY_SITE_NAV_ITEMS.map((item) => {
        if (isNavDropdown(item)) {
          const isActive = item.children.some((child) => pathname.startsWith(child.href));
          const isOpen = active === item.title;

          return (
            <div
              className={styles.dropdown}
              key={item.title}
              onPointerEnter={() => setActive(item.title)}
            >
              <button
                type="button"
                className={`${styles.link} ${styles.dropdownTrigger} ${
                  isActive ? styles.linkActive : ""
                } ${isOpen ? styles.dropdownTriggerOpen : ""}`.trim()}
                aria-haspopup="menu"
                aria-expanded={isOpen}
                ref={(node) => {
                  triggerRefs.current[item.title] = node;
                }}
                onFocus={() => setActive(item.title)}
                onClick={() => setActive(isOpen ? null : item.title)}
              >
                {item.title}
              </button>
            </div>
          );
        }

        const isActive = pathname.startsWith(item.href);
        const badge = "badge" in item ? item.badge : undefined;

        return (
          <Link
            className={`${styles.link} ${isActive ? styles.linkActive : ""}`.trim()}
            href={item.href}
            key={item.href}
            onPointerEnter={close}
            {...(item.newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          >
            {item.title}
            {badge && <span className={styles.badge}>{badge}</span>}
          </Link>
        );
      })}

      <div className={styles.viewport} data-open={active ? "true" : "false"} ref={viewportRef}>
        {dropdowns.map((item) => (
          <div
            className={styles.viewportContent}
            key={item.title}
            data-active={active === item.title ? "true" : "false"}
            // Inactive menus stay mounted for measurement but must not be
            // reachable by pointer, screen reader, or tab order.
            inert={active !== item.title}
            ref={(node) => {
              contentRefs.current[item.title] = node;
            }}
            role="menu"
            aria-label={item.title}
          >
            {item.children.map((child) => (
              <DropdownCard child={child} key={child.href} onNavigate={close} />
            ))}
          </div>
        ))}
      </div>
    </nav>
  );
}
