import { Reenie_Beanie } from "next/font/google";

// Reenie Beanie (OFL, Google Fonts) for the handwritten notes and sent messages only.
// Put `.variable` on a wrapper to expose it as --font-hand.
export const handFont = Reenie_Beanie({ weight: "400", subsets: ["latin"], variable: "--font-hand", display: "swap" });
