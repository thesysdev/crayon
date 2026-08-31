import type { Metadata } from "next";
import { ThemeShell } from "@/components/theme-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vercel AI Chat",
  description: "Generative UI Chat with Vercel AI SDK + OpenUI Renderer",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ThemeShell>{children}</ThemeShell>
      </body>
    </html>
  );
}
