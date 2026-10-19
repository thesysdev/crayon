import { RootProvider } from "fumadocs-ui/provider/next";
import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import Script from "next/script";
import { SITE_NAME, SITE_OPEN_GRAPH } from "../lib/page-metadata";
import { BASE_URL } from "../lib/site-url";
import "./global.css";
import { PHProvider } from "./providers";

const inter = Inter({
  subsets: ["latin"],
});

// Only the OpenUI wordmark uses Geist, so it is not preloaded ahead of the
// fonts and images the first paint actually needs.
const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
  preload: false,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_TITLE = SITE_NAME;
const SITE_DESCRIPTION =
  "OpenUI is the open standard for Intelligent UI. Full-stack, framework-agnostic Generative UI built on OpenUI Lang, a streaming-first language with first-party runtimes for React, Vue, Svelte, and Angular, and up to 67% fewer tokens than JSON.";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: SITE_TITLE,
    template: "%s | OpenUI",
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_TITLE,
  referrer: "origin-when-cross-origin",
  keywords: [
    "OpenUI",
    "Intelligent UI",
    "Generative UI",
    "AI UI",
    "OpenUI Lang",
    "React",
    "LLM",
    "AI apps",
    "streaming UI",
  ],
  authors: [{ name: "OpenUI" }],
  creator: "OpenUI",
  publisher: "OpenUI",
  category: "technology",
  icons: {
    icon: "/shiro-logo.svg",
    shortcut: "/shiro-logo.svg",
    apple: "/shiro-logo.svg",
  },
  openGraph: SITE_OPEN_GRAPH,
  twitter: {
    card: "summary_large_image",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function Layout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.className} ${geist.variable} ${geistMono.variable}`}
      // Lets Next.js skip smooth scrolling on route changes; in-page anchors still scroll smoothly.
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body className="flex flex-col min-h-screen">
        <PHProvider>
          <RootProvider theme={{ defaultTheme: "system", enableSystem: true }}>
            {children}
          </RootProvider>
        </PHProvider>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-MZ0TZ82NM2"
          strategy="lazyOnload"
        />
        <Script id="ga-init" strategy="lazyOnload">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-MZ0TZ82NM2');
          `}
        </Script>
      </body>
    </html>
  );
}
