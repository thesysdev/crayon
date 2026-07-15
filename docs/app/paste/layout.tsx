import { WebsiteThemeProvider } from "@/components/website-theme-provider";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./paste.css";

export const metadata: Metadata = {
  title: "OpenUI Paste",
  description:
    "Paste OpenUI Lang code, validate it against any published @openuidev/lang-core version, replay it as a simulated LLM stream, and see what renders.",
};

export default function PasteLayout({ children }: { children: ReactNode }) {
  return <WebsiteThemeProvider>{children}</WebsiteThemeProvider>;
}
