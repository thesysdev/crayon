import { CSSProperties, useState } from "react";
import { ColorMode, FONT, theme, ThemeTokens } from "../theme";

export default function ReliabilityBanner({ themeMode }: { themeMode: ColorMode }) {
  const [bannerHovered, setBannerHovered] = useState(false);
  const styles = bannerStyles(theme(themeMode));

  return (
    <div style={styles.wrapper}>
      <span style={styles.fade} aria-hidden />
      <a
        style={styles.banner}
        href="https://www.openui.com/docs/openui-lang/reliability"
        target="_blank"
        rel="noreferrer"
        title="Learn how to track and fix errors in production"
        onMouseEnter={() => setBannerHovered(true)}
        onMouseLeave={() => setBannerHovered(false)}
      >
        <span style={styles.text}>
          <span style={styles.title}>Want to track and fix errors in production?</span>
        </span>
        <span
          style={{
            ...styles.bannerAction,
            ...(bannerHovered ? styles.bannerActionHover : null),
          }}
        >
          Learn more
        </span>
      </a>
    </div>
  );
}

const bannerStyles = (t: ThemeTokens) =>
  ({
    wrapper: {
      position: "relative",
      zIndex: 1,
      display: "flex",
      flexDirection: "column",
      gap: 8,
      flexShrink: 0,
      background: t.bg,
      padding: "12px 12px 18px",
    },
    fade: {
      position: "absolute",
      left: 0,
      right: 0,
      top: "100%",
      height: 12,
      background: `linear-gradient(to bottom, ${t.bg}, transparent)`,
      pointerEvents: "none",
    },
    banner: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      flexShrink: 0,
      textDecoration: "none",
      borderRadius: 12,
      background: t.promoBg,
      color: t.fg,
      cursor: "pointer",
      fontFamily: FONT,
      textAlign: "left",
      padding: "12px 14px",
    },
    text: {
      display: "flex",
      flexDirection: "column",
    },
    title: {
      fontSize: 12,
      fontWeight: 500,
    },
    bannerAction: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
      border: `1px solid ${t.controlBorder}`,
      borderRadius: 8,
      background: t.controlBg,
      color: t.fg,
      boxShadow: t.shadowSubtle,
      fontSize: 11,
      padding: "5px 12px",
      transition: "transform 150ms ease",
    },
    bannerActionHover: {
      transform: "scale(0.96)",
    },
  }) satisfies Record<string, CSSProperties>;
