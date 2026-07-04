import { ThemeProvider } from "@/hooks/use-system-theme";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mastra Harness Chat",
  description: "Persistent OpenUI chat backed by Mastra Harness tools and AG-UI streaming",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
