import "@copilotkit/react-core/v2/styles.css";
import "@openuidev/react-ui/layered/styles/index.css";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OpenUI with CopilotKit",
  description: "Streaming generative interfaces inside a CopilotKit v2 chat shell",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
