import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Variable Inter (no fixed weights), so the theme's in-between Medium (560)
// renders as set.
const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OpenUI Self Hosted",
  description: "Generative UI Chat with OpenAI SDK",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
