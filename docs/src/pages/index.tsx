import "./globals.css";

import FAQ from "@site/src/sections/FAQ";
import Features from "../sections/Features";
import Footer from "@site/src/sections/Footer";
import Hero from "../sections/Hero";

import styles from "./index.module.css";
import Navbar from "../components/Navbar";

export default function Home() {
  return (
    <div className={styles.bodyWrapper}>
      <Navbar />
      <div className={styles.pageContainer}>
        <Hero />
        <Features />
        <FAQ />
        <Footer />

        {/*
         */}
      </div>
    </div>
  );
}
