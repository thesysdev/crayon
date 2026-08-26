import { WebsiteThemeProvider } from "@/components/website-theme-provider";
import type { ReactNode } from "react";

export default function CompareLayout({ children }: { children: ReactNode }) {
  return <WebsiteThemeProvider>{children}</WebsiteThemeProvider>;
}
