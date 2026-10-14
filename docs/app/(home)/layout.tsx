import { MarketingThemeProvider } from "@/components/marketing-theme-provider";
import "./globals.css";
import { Navbar } from "./sections/Navbar/Navbar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <MarketingThemeProvider>
      {process.env.NODE_ENV === "development" ? (
        <script src="https://mcp.figma.com/mcp/html-to-design/capture.js" async />
      ) : null}
      <Navbar />
      <div className="homeTheme">{children}</div>
    </MarketingThemeProvider>
  );
}
