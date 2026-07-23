"use client";

import { addThesysLinkAttribution } from "@/lib/thesys-link-attribution";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { useEffect } from "react";

export function PHProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    posthog.init("phc_3OLW53x09ZTVZSV6BEpj5uycj3ooqR6KOemOjx04e3D", {
      api_host: "https://dgoeivjus9jfp.cloudfront.net",
      capture_pageview: "history_change",
      disable_session_recording: false,
      session_recording: {
        sampleRate: 0.1,
      },
    });

    const decorateLink = (anchor: HTMLAnchorElement) => {
      const href = anchor.getAttribute("href");
      if (!href) return;

      const attributedHref = addThesysLinkAttribution(
        href,
        window.location.href,
        posthog.get_distinct_id(),
        posthog.get_session_id(),
      );

      if (attributedHref !== href) anchor.setAttribute("href", attributedHref);
    };

    const decorateLinksWithin = (root: ParentNode) => {
      if (root instanceof HTMLAnchorElement) decorateLink(root);
      root.querySelectorAll<HTMLAnchorElement>("a[href]").forEach(decorateLink);
    };

    decorateLinksWithin(document);

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "attributes") {
          if (mutation.target instanceof HTMLAnchorElement) decorateLink(mutation.target);
          continue;
        }

        for (const node of mutation.addedNodes) {
          if (node instanceof Element) decorateLinksWithin(node);
        }
      }
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["href"],
      childList: true,
      subtree: true,
    });

    const refreshLinkAtInteraction = (event: Event) => {
      if (!(event.target instanceof Element)) return;
      const anchor = event.target.closest<HTMLAnchorElement>("a[href]");
      if (anchor) decorateLink(anchor);
    };

    document.addEventListener("pointerdown", refreshLinkAtInteraction, true);
    document.addEventListener("click", refreshLinkAtInteraction, true);

    return () => {
      observer.disconnect();
      document.removeEventListener("pointerdown", refreshLinkAtInteraction, true);
      document.removeEventListener("click", refreshLinkAtInteraction, true);
    };
  }, []);
  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}
