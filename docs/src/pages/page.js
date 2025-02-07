"use client";

import Image from "next/image";
import styles from "./page.module.css";
import Hero from "@/sections/Hero";
import Features from "@/sections/Features";
import FAQ from "@/sections/FAQ";
import Footer from "@/sections/Footer";

export default function Home() {
  return (
    <div className={styles.pageContainer}>
      <Hero />
      <Features />
      <FAQ />
      <Footer />
    </div>
  );
}
