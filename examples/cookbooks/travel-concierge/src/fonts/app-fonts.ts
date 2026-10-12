import { Inter, Newsreader } from "next/font/google";

// The app's two faces, loaded once. Newsreader stands in for the display serif and Inter for
// interface type; both are open-licensed, so next/font fetches them at build time.
//
// Apply both `.variable` class names to a wrapper, then use:
//   --font-display  Newsreader (variable weight 200-800, real italic)
//   --font-ui       Inter (variable weight)

export const displaySerif = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
  fallback: ["Georgia", "serif"],
});

export const uiSans = Inter({
  subsets: ["latin"],
  variable: "--font-ui",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});
