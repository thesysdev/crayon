import type { Metadata } from "next";
import localFont from "next/font/local";
import { displaySerif } from "../../../fonts/app-fonts";
import Pairings from "./pairings";
import "./drawably/style.css";
import "./pairings.css";

// Design exploration: Timeless Serif with place and food photos, drawably arrows and Drawably Pen.
// drawably (MIT, drawably.dev) is vendored in ./drawably for this page only; it is not in the design system.

export const metadata: Metadata = { title: "Pairings | Design exploration" };

const drawablyPen = localFont({ src: "./drawably/DrawablyPen.ttf", weight: "400", variable: "--font-hand" });

export default function Page() {
  return (
    <div className={`${displaySerif.variable} ${drawablyPen.variable}`}>
      <Pairings />
    </div>
  );
}
