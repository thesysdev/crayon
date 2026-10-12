import { WebsiteThemeProvider } from "@/components/website-theme-provider";
import { createPageMetadata } from "@/lib/page-metadata";
import type { ReactNode } from "react";
import "./layout.css";
import page from "./metadata";

export const metadata = createPageMetadata(page);

export default function DemoGitHubLayout({ children }: { children: ReactNode }) {
  return <WebsiteThemeProvider>{children}</WebsiteThemeProvider>;
}
