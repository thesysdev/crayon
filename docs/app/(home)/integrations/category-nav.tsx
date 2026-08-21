"use client";

import type { MouseEvent } from "react";
import styles from "./page.module.css";

interface CategoryNavItem {
  count: number;
  id: string;
  label: string;
}

export function CategoryNav({ categories }: { categories: CategoryNavItem[] }) {
  const scrollToCategory = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }

    const target = document.getElementById(id);
    if (!target) return;

    event.preventDefault();
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });

    const url = new URL(window.location.href);
    url.hash = id;
    window.history.pushState(null, "", url);
  };

  return (
    <nav className={styles.categoryNav} aria-label="Integration categories">
      {categories.map((category) => (
        <a
          className={styles.categoryNavLink}
          href={`#${category.id}`}
          key={category.id}
          onClick={(event) => scrollToCategory(event, category.id)}
        >
          {category.label}
          <span>{category.count}</span>
        </a>
      ))}
    </nav>
  );
}
