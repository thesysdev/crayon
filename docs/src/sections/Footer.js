import SecondaryButton from "../components/SecondaryButton";
import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <div className={styles.footerSection}>
      <div className={styles.socialCard}>
        <div className={styles.socialIcons}>
          <img
            src="/img/social-icons.png"
            alt="social-icons"
            width={270}
            height={164}
            className={styles.icon}
          />
        </div>
        <h3 className={styles.socialTitle}>Join our community</h3>
        <p className={styles.socialText}>
          Connect with other developers, share your work, and stay updated with
          the latest from Crayon.
        </p>
        <div className={styles.socialButtons}>
          <a
            href="https://discord.com/invite/Pbv5PsqUSv"
            target="_blank"
            rel="noopener noreferrer"
          >
            <SecondaryButton>Discord</SecondaryButton>
          </a>
          <a
            href="https://x.com/thesysdev"
            target="_blank"
            rel="noopener noreferrer"
          >
            <SecondaryButton>Follow on X</SecondaryButton>
          </a>
        </div>
      </div>
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerMain}>
            <div className={styles.footerLogo}>
              <img
                src="/img/thesys-logo.svg"
                alt="Thesys"
                width={90}
                height={36}
              />
            </div>
            <div className={styles.footerLists}>
              <div className={styles.footerList}>
                <h4>Resources</h4>
                <ul>
                  <li>
                    <a href="https://crayonai.org/docs/reference/js">
                      JS Reference
                    </a>
                  </li>
                  <li>
                    <a href="https://crayonai.org/docs">Documentation</a>
                  </li>
                </ul>
              </div>
              <div className={styles.footerList}>
                <h4>About thesys</h4>
                <ul>
                  <li>
                    <a href="https://www.thesys.dev/">thesys</a>
                  </li>
                  <li>
                    <a href="https://www.linkedin.com/company/thesysdev/">
                      LinkedIn
                    </a>
                  </li>
                  <li>
                    <a href="https://x.com/thesysdev">X</a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className={styles.footerBottom}>
            <div className={styles.footerText}>
              © 2025 Thesys Inc. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
