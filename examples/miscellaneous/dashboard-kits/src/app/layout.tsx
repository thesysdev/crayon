import "@openuidev/react-ui/components.css";
import "@openuidev/thesys/styles.css";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

// The kit styles override the base styles above, so they load after them.
import "@openuidev/dashboard-kits/styles.css";
import "./styles.css";

const sans = Geist({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  title: "Dashboard kits | OpenUI example",
  description:
    "E-commerce and product analytics kits for the OpenUI dashboard artifact: components, data tools, rules, and examples.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
