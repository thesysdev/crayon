import styles from "./Features.module.css";

export default function Features() {
  return (
    <>
      <div className={styles.featureContainer}>
        <div className={styles.featuresTitle}>
          All you need for shipping <br /> stunning agents.
        </div>
        <div className={styles.featureBlockContainer}>
          <div className={styles.featureBlock}>
            <div className={styles.featureIcon}>
              <img src="./img/tablet-smartphone.png"></img>
            </div>
            <div className={styles.featureContent}>
              <div className={styles.featureBlockTitle}>
                Build once. Ship everywhere.
              </div>
              <p>
                Every single one of our components and the entire shell are
                meticulously designed to be fully responsive and expertly
                crafted.
              </p>
            </div>
          </div>
          <div className={styles.featureBlock}>
            <div className={styles.featureIcon}>
              <img src="./img/tablet-smartphone.png"></img>
            </div>
            <div className={styles.featureContent}>
              <div className={styles.featureBlockTitle}>
                All the functions you’ll need.
              </div>
              <p>
                Every single one of our components and the entire shell are
                meticulously designed to be fully responsive and expertly
                crafted.
              </p>
            </div>
          </div>
        </div>
        <div className={styles.featureBlockContainer}>
          <div className={styles.featureBlock}>
            <div className={styles.featureIcon}>
              <img src="./img/tablet-smartphone.png"></img>
            </div>
            <div className={styles.featureContent}>
              <div className={styles.featureBlockTitle}>
                Build once. Ship everywhere.
              </div>
              <p>
                Every single one of our components and the entire shell are
                meticulously designed to be fully responsive and expertly
                crafted.
              </p>
            </div>
          </div>
          <div className={styles.featureBlock}>
            <div className={styles.featureIcon}>
              <img src="./img/tablet-smartphone.png"></img>
            </div>
            <div className={styles.featureContent}>
              <div className={styles.featureBlockTitle}>
                All the functions you’ll need.
              </div>
              <p>
                Every single one of our components and the entire shell are
                meticulously designed to be fully responsive and expertly
                crafted.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
