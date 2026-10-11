import styles from "../components/ProductLanding.module.css";

export function AppLessDemo() {
  return (
    <figure className={styles.demoFigure}>
      <video
        className={styles.demoVideo}
        aria-label="Recorded interface-generation demo: OpenUI Lang streams beside a phone interface"
        controls
        muted
        playsInline
        preload="none"
        poster="/appless/interface-demo-poster.jpg"
        width={900}
        height={826}
      >
        <source src="/appless/interface-demo.mp4" type="video/mp4" />
        Your browser does not support embedded video.{" "}
        <a href="/appless/interface-demo.mp4">Watch the demo</a>.
      </video>
      <figcaption>
        Recorded interface-generation demo · Gemma on Cerebras.
        <br />
        Demonstrated orders and payments are simulated.
      </figcaption>
    </figure>
  );
}
