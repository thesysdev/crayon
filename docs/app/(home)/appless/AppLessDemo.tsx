"use client";

import { Pause, Play } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import styles from "../components/ProductLanding.module.css";

export function AppLessDemo() {
  const [playing, setPlaying] = useState(false);

  return (
    <figure className={styles.demoFigure}>
      <div className={styles.demoStage}>
        {playing ? (
          <video
            className={styles.demoAnimation}
            aria-label="AppLess generating and navigating a native phone interface"
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
          >
            <source src="/appless/demo.webm" type="video/webm" />
            <source src="/appless/demo.mp4" type="video/mp4" />
          </video>
        ) : (
          <>
            <Image
              className={`${styles.demoPoster} ${styles.demoPosterLight}`}
              src="/nav/appless-light.webp"
              alt="Two AppLess phone screens showing generated food and order interfaces"
              width={560}
              height={323}
              priority
            />
            <Image
              className={`${styles.demoPoster} ${styles.demoPosterDark}`}
              src="/nav/appless-dark.webp"
              alt=""
              aria-hidden="true"
              width={560}
              height={320}
              priority
            />
          </>
        )}
        <button
          className={styles.demoControl}
          type="button"
          aria-pressed={playing}
          onClick={() => setPlaying((value) => !value)}
        >
          {playing ? <Pause aria-hidden="true" size={16} /> : <Play aria-hidden="true" size={16} />}
          {playing ? "Stop demo" : "Play demo"}
        </button>
      </div>
      <figcaption className={styles.demoCaption}>
        The demo generates interactive native screens, but bookings, purchases, payments, and other
        state-changing actions are simulated.
      </figcaption>
    </figure>
  );
}
