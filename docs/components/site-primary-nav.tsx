"use client";

import { ArrowRight } from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  /* Preview art shown above the label in the desktop mega-menu. Rendered at a
     284x160 slot, so the sources live at 2x (568x320) under /public/nav.
     Decorative — the adjacent title already names the destination. */
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
    title: "Demos",
    children: [
      {
        title: "OpenUI Playground",
        description: "Compare OpenUI Lang with raw code and JSON.",
        href: "/demos",
        preview: {
          light: "/nav/playground-light.webp",
          dark: "/nav/playground-dark.webp",
        },
      },
      {
        title: "OpenUI Chat",
        description: "Try OpenUI OSS and Cloud in a live chat.",
        href: "/chat",
        preview: {
          light: "/nav/chat-light.webp",
          dark: "/nav/chat-dark.webp",
        },
      },
      {
        title: "Dashboard Demo",
        description: "Testdrive a dashboard building experience.",
        href: "/demo/github",
        preview: {
          light: "/nav/dashboard-light.webp",
          dark: "/nav/dashboard-dark.webp",
        },
      },
    ],
  },
  {
    title: "Showcase",
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
        href: "/showcase",
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

export function SitePrimaryNav() {
  const pathname = usePathname();

  return (
    <nav className={styles.nav}>
      {PRIMARY_SITE_NAV_ITEMS.map((item) => {
        if (isNavDropdown(item)) {
          const isActive = item.children.some((child) => pathname.startsWith(child.href));

          return (
            <div className={styles.dropdown} key={item.title}>
              <button
                type="button"
                className={`${styles.link} ${styles.dropdownTrigger} ${
                  isActive ? styles.linkActive : ""
                }`.trim()}
                aria-haspopup="menu"
              >
                {item.title}
              </button>
              <div className={styles.dropdownPanel} role="menu">
                {item.children.map((child) => {
                  return (
                    <Link
                      className={styles.dropdownItem}
                      href={child.href}
                      key={child.href}
                      role="menuitem"
                      {...(child.newTab
                        ? { target: "_blank", rel: "noopener noreferrer" }
                        : {})}
                    >
                      {child.preview && (
                        <span className={styles.dropdownPreview}>
                          {/* Both variants render; CSS reveals the one matching the
                              theme, so there's no hydration flash on first paint. */}
                          <img
                            src={child.preview.light}
                            alt=""
                            aria-hidden="true"
                            width={568}
                            height={320}
                            loading="lazy"
                            draggable={false}
                            className={`${styles.dropdownPreviewImage} ${styles.dropdownPreviewLight}`}
                          />
                          <img
                            src={child.preview.dark}
                            alt=""
                            aria-hidden="true"
                            width={568}
                            height={320}
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
                })}
              </div>
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
            {...(item.newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          >
            {item.title}
            {badge && <span className={styles.badge}>{badge}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
