import { WebsiteThemeProvider } from "@/components/website-theme-provider";
import "./globals.css";
import { Navbar } from "./sections/Navbar/Navbar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <WebsiteThemeProvider>
      <Navbar />
      <div className="homeTheme">{children}</div>
    </WebsiteThemeProvider>
  );
}
