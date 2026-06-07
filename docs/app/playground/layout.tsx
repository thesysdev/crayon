import { WebsiteThemeProvider } from "@/components/website-theme-provider";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./layout.css";

const TITLE = "Playground - Generate UI from a Prompt";
const DESCRIPTION =
  "Build and preview generative UI live in your browser. Prompt an LLM and watch OpenUI render interactive components in real time - no setup required.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/playground" },
  openGraph: {
    type: "website",
    url: "/playground",
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function PlaygroundLayout({ children }: { children: ReactNode }) {
  return <WebsiteThemeProvider>{children}</WebsiteThemeProvider>;
}
