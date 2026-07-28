"use client";

import { loadPostHog } from "@/lib/posthog-client";
import { addThesysLinkAttribution } from "@/lib/thesys-link-attribution";
import { useEffect } from "react";

export function PHProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    let posthogDistinctId: string | undefined;
    let posthogSessionId: string | undefined;

    const load = () => {
      void loadPostHog()
        .then((posthog) => {
          posthogDistinctId = posthog.get_distinct_id();
          posthogSessionId = posthog.get_session_id();
        })
        .catch(() => {
          // Analytics failures must not affect navigation.
        });
    };

    let cancelLoad: () => void;
    if (typeof window.requestIdleCallback === "function") {
      const idleCallbackId = window.requestIdleCallback(load, {
        timeout: 5_000,
      });
      cancelLoad = () => window.cancelIdleCallback(idleCallbackId);
    } else {
      const timeoutId = setTimeout(load, 0);
      cancelLoad = () => clearTimeout(timeoutId);
    }

    const decorateLink = (anchor: HTMLAnchorElement) => {
      const href = anchor.getAttribute("href");
      if (!href) return;

      const attributedHref = addThesysLinkAttribution(
        href,
        window.location.href,
        posthogDistinctId,
        posthogSessionId,
      );

      if (attributedHref !== href) anchor.setAttribute("href", attributedHref);
    };

    document.querySelectorAll<HTMLAnchorElement>("a[href]").forEach(decorateLink);

    const refreshLinkAtInteraction = (event: Event) => {
      if (!(event.target instanceof Element)) return;
      const anchor = event.target.closest<HTMLAnchorElement>("a[href]");
      if (anchor) decorateLink(anchor);
    };

    document.addEventListener("pointerdown", refreshLinkAtInteraction, true);
    document.addEventListener("click", refreshLinkAtInteraction, true);

    return () => {
      cancelLoad();
      document.removeEventListener("pointerdown", refreshLinkAtInteraction, true);
      document.removeEventListener("click", refreshLinkAtInteraction, true);
    };
  }, []);
  return children;
}
