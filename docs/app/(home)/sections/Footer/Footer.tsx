import { getIntegrationsByCategory, integrationCategories } from "@/app/(home)/integrations/data";
import svgPaths from "@/imports/svg-urruvoh2be";
import Link from "next/link";
import { useId } from "react";
import styles from "./Footer.module.css";
import { ThemeTabs } from "./ThemeTabs";

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

interface SocialLink {
  label: string;
  href: string;
  viewBox: string;
  path: string;
  wrapperClassName?: string;
  clipId?: string;
  clipSize?: { width: string; height: string };
}

const SOCIAL_LINKS: SocialLink[] = [
  {
    label: "Twitter",
    href: "https://x.com/thesysdev",
    viewBox: "0 0 24 24",
    path: svgPaths.pa1e7100,
    wrapperClassName: styles.socialIconTwitter,
  },
  {
    label: "Discord",
    href: "https://discord.com/invite/Pbv5PsqUSv",
    viewBox: "0 0 21.9611 17",
    path: svgPaths.p3885cd00,
  },
  {
    label: "YouTube",
    href: "https://www.youtube.com/@thesysdev",
    viewBox: "0 0 22 15.4688",
    path: svgPaths.p23dbbd00,
    wrapperClassName: styles.socialIconYoutube,
    clipId: "clip_yt",
    clipSize: { width: "22", height: "15.4688" },
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/thesysdev/",
    viewBox: "0 0 19 19",
    path: svgPaths.p26fc3100,
    wrapperClassName: styles.socialIconLinkedIn,
    clipId: "clip_li",
    clipSize: { width: "19", height: "19" },
  },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SocialIcon({ link }: { link: SocialLink }) {
  const uniqueId = useId();
  const clipPathId = link.clipId ? `${link.clipId}-${uniqueId}` : undefined;

  const svgContent = clipPathId ? (
    <svg className={styles.absoluteSvg} fill="none" viewBox={link.viewBox}>
      <g clipPath={`url(#${clipPathId})`}>
        <path d={link.path} fill="currentColor" />
      </g>
      <defs>
        <clipPath id={clipPathId}>
          <rect fill="white" height={link.clipSize!.height} width={link.clipSize!.width} />
        </clipPath>
      </defs>
    </svg>
  ) : (
    <svg className={styles.absoluteSvg} fill="none" viewBox={link.viewBox}>
      <path d={link.path} fill="currentColor" />
    </svg>
  );

  return (
    <a
      href={link.href}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.socialLink}
      aria-label={link.label}
    >
      {link.wrapperClassName ? (
        <div className={`${styles.socialIconWrap} ${link.wrapperClassName}`.trim()}>
          {svgContent}
        </div>
      ) : (
        svgContent
      )}
    </a>
  );
}

function SocialIcons() {
  return (
    <div className={styles.socialIcons}>
      {SOCIAL_LINKS.map((link) => (
        <SocialIcon key={link.label} link={link} />
      ))}
    </div>
  );
}

function ThesysLogo() {
  return (
    <a
      className={styles.logoWrap}
      href="https://thesys.dev"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Thesys"
    >
      <svg className={styles.absoluteSvg} fill="none" viewBox="0 0 123.871 49.5484">
        <path d={svgPaths.p16775200} fill="currentColor" />
        <path clipRule="evenodd" d={svgPaths.p29abae30} fill="currentColor" fillRule="evenodd" />
        <path d={svgPaths.p318aaf80} fill="currentColor" />
        <path d={svgPaths.p3f22cf00} fill="currentColor" />
        <path d={svgPaths.p27013980} fill="currentColor" />
        <path d={svgPaths.p21b7f300} fill="currentColor" />
      </svg>
    </a>
  );
}

// Every integration page, one column per category. Rendered on the server so the
// catalog never ships to the client, and read from the catalog so a new page is
// linked from every footer without touching this file.
function IntegrationLinks() {
  return (
    <nav className={styles.integrations} aria-labelledby="footer-integrations">
      <Link className={styles.integrationsTitle} href="/integrations" id="footer-integrations">
        Integrations
      </Link>
      <div className={styles.integrationColumns}>
        {integrationCategories.map((category) => (
          <div key={category.id}>
            <p className={styles.integrationCategory}>{category.shortTitle}</p>
            <ul className={styles.integrationList}>
              {getIntegrationsByCategory(category.id).map((integration) => (
                <li key={integration.slug}>
                  <Link href={`/integrations/${integration.slug}`}>{integration.name}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function Footer() {
  return (
    <footer className={styles.footer}>
      {/* Footer content */}
      <div className={styles.contentSection}>
        <div className={styles.contentContainer}>
          <IntegrationLinks />

          {/* Mark on the left, theme control on the right, sitting directly on
              the separator below. */}
          <div className={styles.brandRow}>
            <ThesysLogo />
            <ThemeTabs />
          </div>

          {/* Bottom bar */}
          <div className={styles.bottomBar}>
            <div className={styles.desktopBottomBar}>
              <p className={styles.desktopMetaLeft}>355 Bryant St, San Francisco, CA 94107</p>
              <SocialIcons />
              <p className={styles.desktopMetaRight}>
                © {new Date().getFullYear()} Thesys Inc. All Rights Reserved
              </p>
            </div>

            <div className={styles.mobileBottomBar}>
              <SocialIcons />
              <div className={styles.mobileMeta}>
                <p className={styles.mobileMetaText}>
                  © {new Date().getFullYear()} Thesys Inc. All Rights Reserved
                </p>
                <p className={styles.mobileMetaText}>355 Bryant St, San Francisco, CA 94107</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
