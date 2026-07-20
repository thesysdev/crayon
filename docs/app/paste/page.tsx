"use client";

import dynamic from "next/dynamic";

// Client-only: the playground drives CodeMirror, CDN version loading and
// playback in the browser, and @openuidev/thesys does not survive SSR.
const Playground = dynamic(() => import("./components/Playground").then((m) => m.Playground), {
  ssr: false,
  loading: () => <div className="paste-loading">Loading playground…</div>,
});

export default function PastePage() {
  return <Playground />;
}
