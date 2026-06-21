import { ThemeProvider } from "@/hooks/use-system-theme";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Eve + OpenUI",
  description: "Generative UI Chat powered by an Eve agent",
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
