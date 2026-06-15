"use client";

import { BarChart3, Boxes, Sparkles, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";
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
  icon: ComponentType<{ className?: string; strokeWidth?: number; "aria-hidden"?: boolean }>;
};

type NavDropdown = {
  title: string;
  children: NavDropdownChild[];
};

export type NavItem = NavLeaf | NavDropdown;

export const PRIMARY_SITE_NAV_ITEMS: NavItem[] = [
  { title: "Docs", href: "/docs", newTab: false },
  {
    title: "Playground",
    children: [
      {
        title: "OpenUI Playground",
        description: "Try OpenUI Lang live in the browser",
        href: "/playground",
        icon: Sparkles,
      },
      {
        title: "Dashboard Demo",
        description: "See OpenUI rendered inside a real app",
        href: "/demo/github",
        newTab: true,
        icon: BarChart3,
      },
    ],
  },
  {
    title: "Projects",
    children: [
      {
        title: "OpenClaw OS",
        description: "Meet the OpenClaw operating system",
        href: "/openclaw-os",
        icon: Boxes,
      },
      {
        title: "Community projects",
        description: "Tools, packages, plugins, and examples",
        href: "/projects",
        icon: Users,
      },
    ],
  },
  { title: "Agent Interface", href: "/agent-interface", newTab: false, badge: "New" },
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
                  const Icon = child.icon;
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
                      <span className={styles.dropdownIconTile} aria-hidden="true">
                        <Icon className={styles.dropdownIcon} strokeWidth={1.8} />
                      </span>
                      <span className={styles.dropdownTitle}>{child.title}</span>
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
