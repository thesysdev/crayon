import type { Metadata } from "next";
import "@openuidev/chat-experiment/charts.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "chat-experiment — chart gallery",
  description:
    "Gallery exercising every @openuidev/chat-experiment chart and its interactions.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
