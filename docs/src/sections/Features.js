import styles from "./Features.module.css";

export default function Features() {
  return (
    <>
      <div className={styles.featureContainer}>
        <div className={styles.featuresTitle}>
          All you need for shipping <br /> stunning AI Interfaces.
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
                Every single one of our components and shell are
                designed to be fully responsive and effortlessly adapt
                to all forms factors - agents, chatbots, copilots.
              </p>
            </div>
          </div>
          <div className={styles.featureBlock}>
            <div className={styles.featureIcon}>
              <img src="./img/tablet-smartphone.png"></img>
            </div>
            <div className={styles.featureContent}>
              <div className={styles.featureBlockTitle}>
                Batteries included
              </div>
              <p>
                Crayon Core provide a powerful abstraction for client-server communication
                in conversational interfaces that can be easily adapted to a vareity of use
                cases including extending it to support your own.
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
                Backend Agnostic
              </div>
              <p>
                Crayon Core's communication interface is
                framework agnostic and doesn't impose any restrictions on the language or
                libraries that can be used in the backend.
              </p>
            </div>
          </div>
          <div className={styles.featureBlock}>
            <div className={styles.featureIcon}>
              <img src="./img/tablet-smartphone.png"></img>
            </div>
            <div className={styles.featureContent}>
              <div className={styles.featureBlockTitle}>
                Customizable & Accessible
              </div>
              <p>
                Crayon UI components are built on top of Radix headless components and expose
                an easy way to theme them at the framework level or override specific styles
                in each component.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
