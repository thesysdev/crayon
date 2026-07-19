"use client";

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
  }, []);
  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}
