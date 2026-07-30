"use client";

import { useEffect } from "react";

export function ThemeImageController() {
  useEffect(() => {
    const root = document.documentElement;

    const syncSources = () => {
      const dark = root.dataset.theme === "dark";
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const media =
        dark === prefersDark ? "(prefers-color-scheme: dark)" : dark ? "all" : "not all";

      document
        .querySelectorAll<HTMLSourceElement>("source[data-theme-source]")
        .forEach((source) => {
          if (source.media !== media) source.media = media;
        });
    };

    syncSources();

    const observer = new MutationObserver(syncSources);
    observer.observe(root, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => observer.disconnect();
  }, []);

  return null;
}
