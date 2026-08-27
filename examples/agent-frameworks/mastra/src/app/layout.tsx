import { ThemeProvider } from "@/hooks/use-system-theme";
import type { Metadata } from "next";
import { Reliability } from "./reliability";
import "./globals.css";

export const metadata: Metadata = {
  title: "OpenUI Chat",
  description: "Generative UI Chat with OpenAI SDK",
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
