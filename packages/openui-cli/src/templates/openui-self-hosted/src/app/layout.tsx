import { OpenUIDevtools } from "@openuidev/devtools";
import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en">
      <body>
        {children}
        {process.env.NODE_ENV === "development" && <OpenUIDevtools />}
      </body>
    </html>
  );
}
