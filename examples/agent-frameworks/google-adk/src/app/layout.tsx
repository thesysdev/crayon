import { ThemeProvider } from "@/hooks/use-system-theme";
import type { Metadata } from "next";
import { Reliability } from "./reliability";
import "./globals.css";

export const metadata: Metadata = {
  title: "OpenUI + Google ADK Chat",
  description: "Generative UI chat backed by a Google ADK agent",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Reliability />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
