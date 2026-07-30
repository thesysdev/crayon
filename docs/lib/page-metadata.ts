import type { Metadata } from "next";

type PageMetadataOptions = {
  pathname: string;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
};

export function createPageMetadata({
  pathname,
  title,
  description,
  image,
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
          url: image,
          width: 560,
          height: 320,
          alt: imageAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}
