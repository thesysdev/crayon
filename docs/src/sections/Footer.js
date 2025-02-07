import Image from "next/image";
import SecondaryButton from "@/components/SecondaryButton";
import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <div className={styles.footerSection}>
      <div className={styles.socialCard}>
        <div className={styles.socialIcons}>
          <Image
            src="/social-icons.png"
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
          <SecondaryButton>Discord</SecondaryButton>
          <SecondaryButton>Follow on X</SecondaryButton>
        </div>
      </div>
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerMain}>
            <div className={styles.footerLogo}>
              <Image
                src="/thesys-logo.svg"
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
                    <a href="#">JS Reference</a>
                  </li>
                  <li>
                    <a href="#">Documentation</a>
                  </li>
                </ul>
              </div>
              <div className={styles.footerList}>
                <h4>About thesys</h4>
                <ul>
                  <li>
                    <a href="#">thesys</a>
                  </li>
                  <li>
                    <a href="#">LinkedIn</a>
                  </li>
                  <li>
                    <a href="#">X</a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className={styles.footerBottom}>
            <div className={styles.footerText}>
              © 2025 Thesys Inc. All rights reserved.
            </div>
            <div className={styles.footerLinks}>
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Use</a>
              <a href="#">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
