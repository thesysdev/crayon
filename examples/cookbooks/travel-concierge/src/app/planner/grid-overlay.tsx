"use client";

import { useEffect, useState } from "react";
import "./grid-overlay.css";

// A Swiss grid over the planner, for debugging layout: 12 columns with 24px gutters inside the
// home page's margins, an 8px baseline, and the page's centre lines. Toggle it with Ctrl+G, the
// grid button in the pill, or ?grid in the URL; it stays on across reloads in this browser.

const KEY = "planner:grid";

export function useGridOverlay() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    let saved = false;
    try {
      saved = localStorage.getItem(KEY) === "1";
    } catch {}
    setOn(saved || new URLSearchParams(location.search).has("grid"));
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && !e.metaKey && e.key.toLowerCase() === "g") {
        e.preventDefault();
        setOn((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(KEY, on ? "1" : "0");
    } catch {}
  }, [on]);
  return [on, setOn] as const;
}

export function GridOverlay({ on }: { on: boolean }) {
  if (!on) return null;
  return (
    <div className="pl-grid" aria-hidden>
      <div className="pl-grid__baseline" />
      <div className="pl-grid__columns">
        {Array.from({ length: 12 }, (_, i) => (
          <div key={i} className="pl-grid__col">
            <span>{i + 1}</span>
          </div>
        ))}
      </div>
      <div className="pl-grid__centre pl-grid__centre--x" />
      <div className="pl-grid__centre pl-grid__centre--y" />
    </div>
  );
}
