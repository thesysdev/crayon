import "@/app/demos/layout.css";
import { WebsiteThemeProvider } from "@/components/website-theme-provider";
import { createPageMetadata } from "@/lib/page-metadata";
import type { ReactNode } from "react";
import { VS_JSON_SUMMARY, VS_JSON_TITLE } from "./summary";

export const metadata = {
  ...createPageMetadata({
    pathname: "/openui-vs-json",
    title: VS_JSON_TITLE,
    description: VS_JSON_SUMMARY,
    image: "/nav/vsjson-light.webp",
    imageAlt: "OpenUI versus JSON preview",
  }),
  title: { absolute: VS_JSON_TITLE },
};

export default function DemosLayout({ children }: { children: ReactNode }) {
  return <WebsiteThemeProvider>{children}</WebsiteThemeProvider>;
}
