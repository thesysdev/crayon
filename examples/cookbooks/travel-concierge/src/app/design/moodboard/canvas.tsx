"use client";

import dynamic from "next/dynamic";
import { Inter } from "next/font/google";
import { uiSans, displaySerif } from "../../../fonts/app-fonts";

// tldraw reads the window and IndexedDB, so the canvas renders only in the browser. The Trips
// panel wraps the studio and gives each trip its own board.
const MoodboardStudio = dynamic(() => import("../../../moodboard/trips-panel"), { ssr: false });

// Inter stands in for Airbnb Cereal in the composer and captions.
const inter = Inter({ subsets: ["latin"], variable: "--mb-font" });
// Timeless Serif sets the editorial display type (headings, titles, pull-quotes, numerals) as
// --font-display; Timeless Sans is available as --font-ui. Body text stays Inter for now.

export default function MoodboardCanvas() {
  return (
    <div className={`${inter.variable} ${displaySerif.variable} ${uiSans.variable}`}>
      <MoodboardStudio />
    </div>
  );
}
