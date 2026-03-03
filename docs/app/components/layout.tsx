import type { ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import styles from "./layout.module.css";
import AppThemeProvider from "@components/components/AppThemeProvider/AppThemeProvider";
import TopNav from "@components/components/TopNav";
import TopBarDocsButton from "@components/components/TopBarDocsButton/TopBarDocsButton";
import ThemeToggle from "@components/components/ThemeToggle";
import { TOP_NAV_ITEMS } from "@components/config/navigation";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OpenUI Design System",
  description: "Foundation, Blocks, and Compose documentation",
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  const fontClassName = [
    inter.variable,
    geistSans.variable,
    geistMono.variable,
  ].join(" ");

  return (
    <AppThemeProvider>
      <div className={`${fontClassName} ${styles.appShell}`}>
        <header className={styles.topBar}>
          <div className={styles.topBarInner}>
            <Link href="/" className={styles.brand}>
              <span className={styles.brandMark} aria-hidden />
              <span className={styles.brandText}>DS</span>
            </Link>
            <TopNav items={TOP_NAV_ITEMS} />
            <div className={styles.topBarControls}>
              <ThemeToggle />
              <TopBarDocsButton />
            </div>
          </div>
        </header>
        <div className={styles.pageContainer}>{children}</div>
      </div>
    </AppThemeProvider>
  );
}
