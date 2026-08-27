import type { Metadata } from "next";
import { Reliability } from "./reliability";
import "./globals.css";

export const metadata: Metadata = {
  title: "Supabase Chat",
  description: "OpenUI chat with Supabase persistence",
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
        {children}
      </body>
    </html>
  );
}
