import type { Metadata } from "next";
import { ThemeProvider } from "@/hooks/use-system-theme";
import { Reliability } from "./reliability";
import "./globals.css";

export const metadata: Metadata = {
  title: "shadcn/ui Chat",
  description: "Generative UI Chat with shadcn/ui components",
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
