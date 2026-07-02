import type { Metadata } from "next";
import { ThemeProvider } from "@/hooks/use-system-theme";
import "./globals.css";

export const metadata: Metadata = {
  title: "OpenUI Cloud",
  description: "Managed OpenUI Cloud Chat with web, image & artifact tools",
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
