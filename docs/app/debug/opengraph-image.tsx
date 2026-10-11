import { renderPageOgImage } from "@/lib/og/templates";
import { metadata } from "./layout";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return renderPageOgImage(metadata);
}
