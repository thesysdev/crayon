"use client";

import { useEffect } from "react";

const GA_ID = "G-MZ0TZ82NM2";
const FALLBACK_DELAY_MS = 30_000;

type AnalyticsWindow = Window & {
  dataLayer?: unknown[][];
};

export function DeferredAnalytics() {
  useEffect(() => {
    let loaded = false;
    let idleCallbackId: number | undefined;

    const load = () => {
      if (loaded) return;
      loaded = true;

      const analyticsWindow = window as AnalyticsWindow;
      analyticsWindow.dataLayer ??= [];
      analyticsWindow.dataLayer.push(["js", new Date()]);
      analyticsWindow.dataLayer.push(["config", GA_ID]);

      const script = document.createElement("script");
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
      document.head.appendChild(script);
    };

    const scheduleAfterNextPaint = () => {
      window.requestAnimationFrame(() => {
        if ("requestIdleCallback" in window) {
          idleCallbackId = window.requestIdleCallback(load, { timeout: 2_000 });
        } else {
          setTimeout(load, 0);
        }
      });
    };

    const interactionEvents = ["pointerdown", "keydown", "touchstart"] as const;
    interactionEvents.forEach((eventName) => {
      window.addEventListener(eventName, scheduleAfterNextPaint, {
        once: true,
        passive: true,
      });
    });

    const fallbackTimer = window.setTimeout(load, FALLBACK_DELAY_MS);

    return () => {
      window.clearTimeout(fallbackTimer);
      if (idleCallbackId !== undefined && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleCallbackId);
      }
      interactionEvents.forEach((eventName) => {
        window.removeEventListener(eventName, scheduleAfterNextPaint);
      });
    };
  }, []);

  return null;
}
