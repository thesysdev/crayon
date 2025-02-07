import PrimaryButton from "@site/src/components/PrimaryButton";
import SecondaryButton from "@site/src/components/SecondaryButton";
import styles from "./Hero.module.css";
import { useState, useEffect } from "react";

export default function Hero() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 720);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <>
      <div className={styles.heroContainer}>
        <div className={styles.titleGrid}>
          <div className={styles.row1}>
            <div className={styles.row1block1} id={styles.fillerblock}></div>
            <div className={styles.row1block2}>
              <div className={styles.subtitle}>
                The Generative UI Toolkit for building Agents
              </div>
            </div>
            <div className={styles.row1block3} id={styles.fillerblock}></div>
          </div>
          <div className={styles.row2}>
            <img src="./img/crayon-logo.svg"></img>
          </div>
          <div className={styles.row3}>
            <div className={styles.row3block1} id={styles.fillerblock}></div>
            <div className={styles.ctaBlock}>
              <div className={styles.ctaContainer}>
                <a
                  href="https://crayonai.org/docs"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <PrimaryButton>Get Started</PrimaryButton>
                </a>
                <a
                  href="https:/crayonai.org/docs"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <SecondaryButton>Tutorial</SecondaryButton>
                </a>
              </div>
              <div className={styles.ctaBuild}>~ npx import crayon</div>
            </div>
            <div className={styles.row3block3} id={styles.fillerblock}></div>
          </div>
        </div>
        <div className={styles.componentContainer}>
          <img
            src="/img/components.png"
            alt="Components"
            className={`${styles.componentsImage} ${styles.desktopImage}`}
          />
          <img
            src="/img/components-mobile.png"
            alt="Components"
            className={`${styles.componentsImage} ${styles.mobileImage}`}
          />
        </div>
      </div>
    </>
  );
}
