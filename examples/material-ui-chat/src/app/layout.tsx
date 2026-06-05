import { ThemeProvider } from "@/hooks/use-system-theme";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MUI Chat",
  description: "Generative UI Chat with Material UI and OpenAI SDK",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
