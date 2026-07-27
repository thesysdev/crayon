import { WebsiteThemeProvider } from "@/components/website-theme-provider";
import "@openuidev/react-ui/styles/index.css";
import "@openuidev/thesys/styles.css";
import type { ReactNode } from "react";

export default function ChatLayout({ children }: { children: ReactNode }) {
  return <WebsiteThemeProvider>{children}</WebsiteThemeProvider>;
}
