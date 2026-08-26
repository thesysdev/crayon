import { WebsiteThemeProvider } from "@/components/website-theme-provider";
import { createPageMetadata } from "@/lib/page-metadata";
import type { ReactNode } from "react";
import "./layout.css";

export const metadata = createPageMetadata({
  pathname: "/demo/github",
  title: "OpenUI GitHub Dashboard Demo",
  description: "Generate interactive dashboards from live GitHub data with OpenUI.",
  image: "/nav/dashboard-light.webp",
  imageAlt: "OpenUI GitHub dashboard preview",
});

export default function DemoGitHubLayout({ children }: { children: ReactNode }) {
  return <WebsiteThemeProvider>{children}</WebsiteThemeProvider>;
}
