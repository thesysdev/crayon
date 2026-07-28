import { DocsRouteLayout } from "@/components/docs-route-layout";
import { WebsiteThemeProvider } from "@/components/website-theme-provider";
import { source } from "@/lib/source";
import { RootProvider } from "fumadocs-ui/provider/next";
import "./fumadocs.css";

export default function Layout({ children }: LayoutProps<"/docs">) {
  return (
    <RootProvider theme={{ enabled: false }}>
      <WebsiteThemeProvider>
        <DocsRouteLayout tree={source.getPageTree()}>{children}</DocsRouteLayout>
      </WebsiteThemeProvider>
    </RootProvider>
  );
}
