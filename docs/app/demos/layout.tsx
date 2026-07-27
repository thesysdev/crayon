import { WebsiteThemeProvider } from "@/components/website-theme-provider";
import { createPageMetadata } from "@/lib/page-metadata";
import type { ReactNode } from "react";
import "./layout.css";

export const metadata = createPageMetadata({
  pathname: "/demos",
  title: "OpenUI vs JSON",
  description: "See how OpenUI runs 3x faster with 67% fewer tokens than JSON.",
  imageAlt: "OpenUI versus JSON preview",
});

export default function DemosLayout({ children }: { children: ReactNode }) {
  return <WebsiteThemeProvider>{children}</WebsiteThemeProvider>;
}
