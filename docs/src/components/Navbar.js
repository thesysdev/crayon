import Image from "next/image";
import { ExternalLink } from "lucide-react";
import styles from "./Navbar.module.css";

export default function Navbar() {
  return (
    <div className={`${styles.navbarContainer}`}>
      <nav className={`${styles.navbar} font-inter`}>
        <div className={styles.logo}>
          <a
            href="https://www.thesys.dev"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              src="/thesys-t.svg"
              alt="Crayon Logo"
              width={24}
              height={24}
            />
          </a>
          <span className={styles.logoSlash}>/</span>
          <Image
            src="/crayon-logo.svg"
            alt="Crayon Logo"
            width={96}
            height={24}
          />
        </div>
        <div className={styles.buttons}>
          <a
            href="https://crayonai.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            <button
              className={`${styles.navButton} ${styles.docButton}`}
              id={styles.mobileDisappear}
            >
              Documentation
              <ExternalLink size={20} />
            </button>
          </a>
          <a
            href="https://crayonai.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            <button className={styles.navButton}>
              <Image
                src="/github-logo.svg"
                alt="GitHub"
                width={20}
                height={20}
                className={styles.buttonIcon}
              />
              GitHub
            </button>
          </a>
        </div>
      </nav>
    </div>
  );
}
