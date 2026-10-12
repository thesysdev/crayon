"use client";

import { Fragment, type ReactNode, useEffect, useState } from "react";
import "./weather-line.css";

// The planner's weather, retold by the concierge. /api/planner/weather-line writes a line with
// {temp}, {sky} and {place} slots; the page fills them with the same temperature, 3D icon and
// flag-and-city as the plain line, so the icons stay inline. Lines are kept for the tab's
// session per reading, so coming back to the planner doesn't wait for a new one.

export type Reading = { temp: number; conditions: string; city: string; country: string; isDay: boolean };

const cache = new Map<string, Promise<string | null>>();

function fetchLine(reading: Reading): Promise<string | null> {
  const key = JSON.stringify(reading);
  try {
    const kept = sessionStorage.getItem(`pl-weather-line:${key}`);
    if (kept) return Promise.resolve(kept);
  } catch {}
  let pending = cache.get(key);
  if (!pending) {
    pending = fetch("/api/planner/weather-line", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: key,
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((body: { line?: string | null } | null) => {
        const line = body?.line ?? null;
        try {
          if (line) sessionStorage.setItem(`pl-weather-line:${key}`, line);
        } catch {}
        return line;
      })
      .catch(() => null);
    pending.then((line) => line || cache.delete(key));
    cache.set(key, pending);
  }
  return pending;
}

/** The concierge's line for a reading, or null until it arrives (and for good if it fails). */
export function useWeatherLine(reading: Reading | null) {
  const key = reading ? JSON.stringify(reading) : "";
  const [line, setLine] = useState<{ key: string; text: string } | null>(null);
  useEffect(() => {
    if (!key) return;
    let gone = false;
    fetchLine(JSON.parse(key)).then((text) => !gone && text && setLine({ key, text }));
    return () => {
      gone = true;
    };
  }, [key]);
  return line?.key === key ? line.text : null;
}

/** The line with its slots filled: {temp}, {sky} and {place} become the given nodes. */
export function fillLine(line: string, slots: { temp: ReactNode; sky: ReactNode; place: ReactNode }) {
  return line.split(/(\{temp\}|\{sky\}|\{place\})/).map((part, i) => {
    const slot = part.match(/^\{(temp|sky|place)\}$/)?.[1] as keyof typeof slots | undefined;
    return <Fragment key={i}>{slot ? slots[slot] : part}</Fragment>;
  });
}
