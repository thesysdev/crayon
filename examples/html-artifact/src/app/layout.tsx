import { ThemeProvider } from "@/hooks/use-system-theme";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OpenUI HTML Artifact",
  description: "Open-ended HTML generation with OpenUI",
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
