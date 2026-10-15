/**
 * Layouts for every OG image on the site. Each image is a 1200×630 PNG, prerendered by
 * `app/og/[...path]/route.tsx` from an `OgCardData` description.
 *
 * Renders with Takumi, which supports a subset of CSS: every element with children needs
 * `display: "flex"`, and images must be data URIs (see `publicImage` in `./render`).
 */

import {
  CalendarDays,
  ChartColumn,
  ChevronsUpDown,
  ClipboardList,
  GalleryHorizontal,
  Hash,
  ImageIcon,
  Info,
  List,
  ListOrdered,
  type LucideIcon,
  MessagesSquare,
  MousePointerClick,
  PanelsTopLeft,
  SlidersHorizontal,
  Sparkles,
  SquareStack,
  Table,
  TextCursorInput,
} from "lucide-react";

/**
 * Part of every OG image URL's `?v=` hash, so link-preview caches refetch after a design change.
 * Bump this whenever you change anything in this file that affects the rendered output.
 */
export const TEMPLATE_VERSION = 2;

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
      /**
       * Site-wide card for the homepage and blog index: Shiro over a wall of component names.
       * `title` is only the alt text.
       */
      template: "home";
      title: string;
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
          <img alt="" src={logo} width={55} height={44} />
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
            <img alt="" src={logo} width={90} height={72} />
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
          <img alt="" src={logo} width={45} height={36} />
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

/** Component names for the homepage card's background wall, each shown after its icon. */
const WALL_ITEMS: { label: string; Icon: LucideIcon }[] = [
  { label: "Open standard of Generative UI", Icon: Sparkles },
  { label: "Charts", Icon: ChartColumn },
  { label: "Buttons", Icon: MousePointerClick },
  { label: "Forms", Icon: ClipboardList },
  { label: "Tables", Icon: Table },
  { label: "Cards", Icon: SquareStack },
  { label: "Tabs", Icon: PanelsTopLeft },
  { label: "Date Pickers", Icon: CalendarDays },
  { label: "Carousels", Icon: GalleryHorizontal },
  { label: "Accordions", Icon: ChevronsUpDown },
  { label: "Sliders", Icon: SlidersHorizontal },
  { label: "Callouts", Icon: Info },
  { label: "Steps", Icon: ListOrdered },
  { label: "Images", Icon: ImageIcon },
  { label: "Follow-up Blocks", Icon: MessagesSquare },
  { label: "Inputs", Icon: TextCursorInput },
  { label: "Lists", Icon: List },
  { label: "Tags", Icon: Hash },
];

const WALL_ROWS = 9;
const WALL_ROW_HEIGHT = 72;
const WALL_GAP = 40;
const WALL_FONT_SIZE = 40;
const WALL_ICON_SIZE = 34;
const WALL_ICON_GAP = 12;

function wallRowOffset(row: number) {
  return row % 2 ? -260 : -60;
}

/** The wall is a plain grey close to the background, so it reads as texture behind Shiro. */
const HOME_COLORS = { background: "#141414", wall: "#2c2c2c" };

/** One row of the wall: the item list rotated by `row`, so no column lines up. */
function wallRow(row: number) {
  const start = (row * 5) % WALL_ITEMS.length;
  return [...WALL_ITEMS.slice(start), ...WALL_ITEMS.slice(0, start)];
}

function TextWall() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        position: "absolute",
        top: 0,
        left: 0,
        ...OG_SIZE,
        overflow: "hidden",
      }}
    >
      {Array.from({ length: WALL_ROWS }, (_, row) => (
        <div
          key={row}
          style={{
            display: "flex",
            gap: WALL_GAP,
            height: WALL_ROW_HEIGHT,
            alignItems: "center",
            marginLeft: wallRowOffset(row),
            fontSize: WALL_FONT_SIZE,
            fontWeight: 400,
            whiteSpace: "pre",
            color: HOME_COLORS.wall,
          }}
        >
          {wallRow(row).map(({ label, Icon }) => (
            <div
              key={label}
              style={{ display: "flex", alignItems: "center", gap: WALL_ICON_GAP, flexShrink: 0 }}
            >
              <Icon size={WALL_ICON_SIZE} strokeWidth={1.75} color={HOME_COLORS.wall} />
              <span>{label}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

type OgHomeProps = { mascot: string; grain: string; title: string };

/**
 * Homepage card: Shiro centred on a dark wall of component names with their icons, under a
 * layer of film grain like the blog covers. The wall runs behind Shiro and his white face
 * covers it. Shiro is never recoloured.
 */
export function OgHome({ mascot, grain, title }: OgHomeProps) {
  return (
    <div
      style={{
        display: "flex",
        position: "relative",
        ...OG_SIZE,
        overflow: "hidden",
        backgroundColor: HOME_COLORS.background,
        fontFamily: "Inter",
      }}
    >
      <TextWall />

      {/* Film grain over the wall, drawn at 2x so each speck is 2px. */}
      <img alt="" src={grain} style={{ position: "absolute", top: 0, left: 0, ...OG_SIZE }} />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "absolute",
          top: 0,
          left: 0,
          ...OG_SIZE,
        }}
      >
        <img alt={title} src={mascot} width={300} height={240} />
      </div>
    </div>
  );
}
