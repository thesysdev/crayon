import type { Metadata } from "next";
import {
  Caveat_Brush,
  Covered_By_Your_Grace,
  Homemade_Apple,
  Nothing_You_Could_Do,
  Permanent_Marker,
  Reenie_Beanie,
} from "next/font/google";
import localFont from "next/font/local";
import { displaySerif } from "../../../fonts/app-fonts";

// Throwaway page: handwritten candidates set beside the real Timeless Serif (wght 380, STYL 40).
// Candidates are Google Fonts under the SIL Open Font License, plus Drawably Pen (MIT), so web use is fine.

export const metadata: Metadata = { title: "Handwriting pairing | Design exploration" };

const reenie = Reenie_Beanie({ weight: "400", subsets: ["latin"] });
const marker = Permanent_Marker({ weight: "400", subsets: ["latin"] });
const apple = Homemade_Apple({ weight: "400", subsets: ["latin"] });
const nothing = Nothing_You_Could_Do({ weight: "400", subsets: ["latin"] });
const brush = Caveat_Brush({ weight: "400", subsets: ["latin"] });
const grace = Covered_By_Your_Grace({ weight: "400", subsets: ["latin"] });
// From the MIT-licensed drawably npm package (drawably.dev), copied here for the comparison only.
const drawablyPen = localFont({ src: "./DrawablyPen.ttf", weight: "400" });

const candidates = [
  { name: "Reenie Beanie", font: reenie, scale: 1.35, note: "Fast felt-tip scrawl. Reads like a real margin note on a contact sheet.", pick: true },
  { name: "Drawably Pen", font: drawablyPen, scale: 0.85, note: "The drawably.dev font: even, round monoline pen. Friendly and tidy, which tips toward cute here." },
  { name: "Permanent Marker", font: marker, scale: 0.85, note: "Loud and graphic. Great for one or two words on a photo, too heavy for sentences." },
  { name: "Covered By Your Grace", font: grace, scale: 1.15, note: "Confident marker print, a bit rounder. Legible at small sizes." },
  { name: "Caveat Brush", font: brush, scale: 1.1, note: "Brushy and warm. Very common on travel sites, so it feels less distinctive." },
  { name: "Nothing You Could Do", font: nothing, scale: 0.9, note: "Light, loose cursive. Pretty, but thin strokes go quiet next to Timeless." },
  { name: "Homemade Apple", font: apple, scale: 0.8, note: "Looping fountain-pen script. Elegant but slow to read, and wide." },
];

const serif = {
  fontFamily: "var(--font-display)",
  fontVariationSettings: '"wght" 380, "STYL" 40',
} as const;

export default function Page() {
  return (
    <main
      className={displaySerif.variable}
      style={{ background: "#f1f2f3", color: "#000", minHeight: "100vh", padding: "56px 48px 96px" }}
    >
      <p style={{ ...serif, fontSize: 18, margin: 0 }}>Handwriting to pair with Timeless Serif</p>
      <p style={{ fontFamily: "system-ui", fontSize: 13, color: "#5f6369", margin: "6px 0 48px" }}>
        Throwaway comparison. Every candidate is free for web use (SIL OFL, or MIT for Drawably Pen).
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(520px, 1fr))", gap: 24 }}>
        {candidates.map((c) => (
          <section
            key={c.name}
            style={{
              background: "#fff",
              borderRadius: 4,
              padding: "36px 36px 28px",
              outline: c.pick ? "2px solid #ff5364" : "none",
              position: "relative",
            }}
          >
            {/* Photo-led card: image block with the hand note scrawled over it */}
            <div
              style={{
                height: 220,
                borderRadius: 2,
                background: "linear-gradient(160deg, #ff2d55 0%, #ff5364 45%, #feb600 100%)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <span
                className={c.font.className}
                style={{
                  position: "absolute",
                  left: 24,
                  bottom: 20,
                  color: "#fff",
                  fontSize: 44 * c.scale,
                  lineHeight: 1,
                  transform: "rotate(-4deg)",
                  transformOrigin: "left bottom",
                }}
              >
                best sunset in Lisbon!
              </span>
            </div>

            <h2 style={{ ...serif, fontSize: 56, lineHeight: 1, letterSpacing: "-0.02em", margin: "28px 0 0" }}>
              Three days in Lisbon
            </h2>
            <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginTop: 10 }}>
              <span style={{ ...serif, fontSize: 22 }}>Alfama, 14 to 17 May</span>
              <span className={c.font.className} style={{ fontSize: 30 * c.scale, color: "#e0263c", transform: "rotate(-3deg)", display: "inline-block" }}>
                ← book the tram early
              </span>
            </div>
            <p className={c.font.className} style={{ fontSize: 26 * c.scale, lineHeight: 1.2, margin: "22px 0 0" }}>
              Pastéis at 8, then up to the miradouro before the crowds. Dinner at the place Ana recommended, 123 €.
            </p>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 28, borderTop: "1px solid #e7e9eb", paddingTop: 14 }}>
              <span style={{ fontFamily: "system-ui", fontSize: 13, fontWeight: 600 }}>
                {c.name}
                {c.pick ? <span style={{ color: "#b3172b" }}> · recommended</span> : null}
              </span>
              <span style={{ fontFamily: "system-ui", fontSize: 12, color: "#5f6369", maxWidth: 300, textAlign: "right" }}>{c.note}</span>
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
