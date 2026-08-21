import { WebsiteThemeProvider } from "@/components/website-theme-provider";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "OpenUI Debug",
  description:
    "Try OpenUI Lang against any published @openuidev/lang-core version, replay it as a simulated LLM stream, and see what renders.",
};

export default function DebugLayout({ children }: { children: ReactNode }) {
  return <WebsiteThemeProvider>{children}</WebsiteThemeProvider>;
}
