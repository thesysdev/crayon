"use client";

import { Pause, Play } from "lucide-react";
import { useState } from "react";
import styles from "../components/ProductLanding.module.css";

export function OuiComparison() {
  const [playing, setPlaying] = useState(false);

  return (
    <figure className={styles.comparisonFigure}>
      <div className={styles.comparisonStage}>
        {playing ? (
          <iframe
            className={styles.comparisonFrame}
            src="/blog/dg-reveal.html"
            title="Base DiffusionGemma and OUI-1 generate an interface from the same brief"
          />
        ) : (
          <div className={styles.comparisonPoster}>
            <div>
              <p>One brief</p>
              <span>“Build me a personal finance home screen”</span>
            </div>
            <div className={styles.comparisonModels} aria-hidden="true">
              <span>DiffusionGemma</span>
              <span>OUI-1</span>
            </div>
          </div>
        )}
        <button
          className={styles.comparisonControl}
          type="button"
          aria-pressed={playing}
          onClick={() => setPlaying((value) => !value)}
        >
          {playing ? <Pause aria-hidden="true" size={16} /> : <Play aria-hidden="true" size={16} />}
          {playing ? "Stop comparison" : "Play comparison"}
        </button>
      </div>
      <figcaption className={styles.comparisonCaption}>
        <span>Base DiffusionGemma and OUI-1 generate the same interface side by side.</span>
        <a href="/blog/dg-reveal.html" target="_blank" rel="noopener noreferrer">
          Open full size
        </a>
      </figcaption>
    </figure>
  );
}
