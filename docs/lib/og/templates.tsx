/**
 * Layouts for every OG image on the site. Each image is a 1200×630 PNG, prerendered by
 * `app/og/[...path]/route.tsx` from an `OgCardData` description.
 *
 * Renders with Takumi, which supports a subset of CSS: every element with children needs
 * `display: "flex"`, and images must be data URIs (see `publicImage` in `./render`).
 */

/**
 * Part of every OG image URL's `?v=` hash, so link-preview caches refetch after a design change.
 * Bump this whenever you change anything in this file that affects the rendered output.
 */
export const TEMPLATE_VERSION = 1;

export const OG_SIZE = { width: 1200, height: 630 };

/** What one OG image shows. Asset paths are relative to `public/`. */
export type OgCardData =
  | {
      template: "card";
      title: string;
      description?: string;
      /** Small label in the top right, e.g. the docs section. */
      eyebrow?: string;
      /** Shown as `partnerLogo × OpenUI` above the title. */
      partnerLogo?: string;
    }
  | {
      /** Site-wide card for the homepage and blog index: tagline over product artwork. */
      template: "home";
      title: string;
      tagline: string;
      art: string;
    }
  | {
      template: "cover";
      /** Blog cover art, cropped to fill the top of the image. */
      cover: string;
      title: string;
      author?: string;
    };

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
  partnerLogo?: string;
};

/**
 * Text card used by docs, marketing pages, integrations, and blog posts without a cover.
 * The OpenUI mark sits top left, and the title and description sit at the bottom. Both are
 * clamped to two lines so long metadata never overflows.
 */
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

      {/* `marginTop: auto` pushes the text block to the bottom edge. */}
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

type OgHomeProps = { logo: string; art: string; title: string; tagline: string };

/** Homepage card: the hero's two-tone headline above the product artwork, which bleeds off the bottom. */
export function OgHome({ logo, art, title, tagline }: OgHomeProps) {
  return (
    <div
      style={{
        display: "flex",
        position: "relative",
        ...OG_SIZE,
        backgroundColor: COLORS.background,
        fontFamily: "Inter",
      }}
    >
      <img
        alt=""
        src={art}
        style={{ position: "absolute", top: HOME_ART_TOP, left: -40, width: 1280, height: 503 }}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          position: "absolute",
          top: 56,
          left: 72,
          gap: 4,
          fontSize: 60,
          fontWeight: 600,
          lineHeight: 1.1,
          letterSpacing: "-0.03em",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18, color: COLORS.primary }}>
          <img alt="" src={logo} width={67} height={64} />
          <span>{title}</span>
        </div>
        <span style={{ color: COLORS.secondary }}>{tagline}</span>
      </div>
    </div>
  );
}

/** Where the homepage artwork starts; its own top margin leaves room for the headline. */
const HOME_ART_TOP = 170;

/**
 * Height of the cover art. The art fills the top of the image, and the title sits on the dark
 * band below it, so text never overlaps the centered artwork most covers have.
 */
const COVER_HEIGHT = 460;

type OgCoverProps = { src: string; logo: string; title: string; author?: string };

/** Blog post with a cover: cover art on top, title and author on a dark band, OpenUI pill top left. */
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
      {/* `objectFit: cover` center-crops covers of any aspect ratio. */}
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
      {/* Overlay: fades the bottom of the cover into the band that holds the title. */}
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
        {/* The white pill keeps the mark legible on any cover. */}
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
