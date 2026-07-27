import type { Metadata } from "next";

const SOCIAL_IMAGE = "/meta-image.png?v=20260725-1708";

type PageMetadataOptions = {
  pathname: string;
  title: string;
  description: string;
  imageAlt: string;
};

export function createPageMetadata({
  pathname,
  title,
  description,
  imageAlt,
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
      images: [
        {
          url: SOCIAL_IMAGE,
          width: 1800,
          height: 942,
          alt: imageAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [SOCIAL_IMAGE],
    },
  };
}
