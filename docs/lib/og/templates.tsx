import type { Metadata } from "next";
import { OG_SIZE, publicImage, renderOgImage } from "./render";

const COLORS = {
  background: "#ffffff",
  primary: "#0a0a0a",
  secondary: "#8a8a8a",
  hairline: "rgba(0, 0, 0, 0.09)",
};

type OgCardProps = {
  logo: string;
  eyebrow?: string;
  title: string;
  description?: string;
  /** Logos shown as `logo × OpenUI` above the title. */
  partnerLogo?: string;
};

export function OgCard({ logo, eyebrow, title, description, partnerLogo }: OgCardProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        padding: "64px 72px",
        backgroundColor: COLORS.background,
        fontFamily: "Inter",
        color: COLORS.primary,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <img alt="" src={logo} width={46} height={44} />
          <span style={{ fontSize: 32, fontWeight: 600, letterSpacing: "-0.02em" }}>OpenUI</span>
        </div>
        {eyebrow && (
          <span style={{ fontSize: 26, fontWeight: 500, color: COLORS.secondary }}>{eyebrow}</span>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", marginTop: "auto", gap: 20 }}>
        {partnerLogo && (
          <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 16 }}>
            <img alt="" src={partnerLogo} width={72} height={72} style={{ objectFit: "contain" }} />
            <span style={{ fontSize: 40, color: COLORS.secondary }}>×</span>
            <img alt="" src={logo} width={76} height={72} />
          </div>
        )}
        <span
          style={{
            fontSize: 76,
            fontWeight: 600,
            lineHeight: 1.08,
            letterSpacing: "-0.03em",
            lineClamp: 2,
            textOverflow: "ellipsis",
          }}
        >
          {title}
        </span>
        {description && (
          <span
            style={{
              fontSize: 34,
              lineHeight: 1.3,
              letterSpacing: "-0.01em",
              color: COLORS.secondary,
              lineClamp: 2,
              textOverflow: "ellipsis",
            }}
          >
            {description}
          </span>
        )}
      </div>
    </div>
  );
}

function metadataText(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    if ("absolute" in value) return String(value.absolute);
    if ("default" in value) return String(value.default);
  }
  return undefined;
}

/** Renders a page's OG card from its own `metadata`, preferring the `openGraph` title and description. */
export async function renderPageOgImage(metadata: Metadata, partnerLogo?: string) {
  return renderOgImage(
    <OgCard
      logo={(await publicImage("/shiro-logo.svg"))!}
      title={metadataText(metadata.openGraph?.title ?? metadata.title) ?? "OpenUI"}
      description={metadataText(metadata.openGraph?.description ?? metadata.description)}
      partnerLogo={partnerLogo && (await publicImage(partnerLogo))}
    />,
  );
}

/** The cover fills the top; the title sits on a solid band below so it never overlaps the art. */
const COVER_HEIGHT = 460;

type OgCoverProps = { src: string; logo: string; title: string; author?: string };

export function OgCover({ src, logo, title, author }: OgCoverProps) {
  return (
    <div
      style={{
        display: "flex",
        position: "relative",
        ...OG_SIZE,
        backgroundColor: COLORS.primary,
        fontFamily: "Inter",
      }}
    >
      <img
        alt=""
        src={src}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: OG_SIZE.width,
          height: COVER_HEIGHT,
          objectFit: "cover",
        }}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          position: "absolute",
          top: 0,
          left: 0,
          ...OG_SIZE,
          padding: "48px 64px 56px",
          backgroundImage:
            "linear-gradient(to bottom, rgba(10, 10, 10, 0) 45%, rgb(10, 10, 10) 68%)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            alignSelf: "flex-start",
            gap: 12,
            padding: "10px 20px 10px 14px",
            borderRadius: 999,
            backgroundColor: COLORS.background,
            color: COLORS.primary,
          }}
        >
          <img alt="" src={logo} width={38} height={36} />
          <span style={{ fontSize: 28, fontWeight: 600, letterSpacing: "-0.02em" }}>OpenUI</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, color: "#ffffff" }}>
          <span
            style={{
              fontSize: 56,
              fontWeight: 600,
              lineHeight: 1.08,
              letterSpacing: "-0.03em",
              lineClamp: 2,
              textOverflow: "ellipsis",
            }}
          >
            {title}
          </span>
          {author && (
            <span style={{ fontSize: 28, fontWeight: 500, color: "rgba(255, 255, 255, 0.75)" }}>
              {author}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
