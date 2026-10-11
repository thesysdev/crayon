import type { Metadata } from "next";

type PageMetadataOptions = {
  pathname: string;
  title: string;
  description: string;
};

export function createPageMetadata({
  pathname,
  title,
  description,
}: PageMetadataOptions): Metadata {
  return {
    title,
    description,
    alternates: {
      canonical: pathname,
    },
    openGraph: {
      title,
      description,
      url: pathname,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}
