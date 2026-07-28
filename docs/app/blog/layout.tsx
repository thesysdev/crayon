import { WebsiteThemeProvider } from "@/components/website-theme-provider";
import type { Metadata } from "next";
import "../(home)/globals.css";
import { BlogNavbar } from "./components/BlogNavbar";
import "./fumadocs.css";

export const metadata: Metadata = {
  alternates: {
    canonical: "/blog",
  },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <WebsiteThemeProvider>
      <BlogNavbar />
      <div className="homeTheme">{children}</div>
    </WebsiteThemeProvider>
  );
}
