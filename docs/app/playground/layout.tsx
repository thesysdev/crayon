import { WebsiteThemeProvider } from "@/components/website-theme-provider";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./layout.css";

export const metadata: Metadata = {
  alternates: {
    canonical: "/playground",
  },
};

export default function PlaygroundLayout({ children }: { children: ReactNode }) {
  return <WebsiteThemeProvider>{children}</WebsiteThemeProvider>;
}
