"use client";

import { BlockVariantPreview, PreviewPage, PreviewSection } from "@components/components/preview";
import { ImageBlock } from "@openuidev/react-ui";
import styles from "./page.module.css";

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1738168246881-40f35f8aba0a?w=900&auto=format&fit=crop&q=60";

function DefaultImageBlockPreview() {
  return (
    <div className={styles.previewWrapper}>
      <div className={styles.desktopFrame}>
        <ImageBlock src={DEFAULT_IMAGE} alt="Landscape preview" />
      </div>
    </div>
  );
}

export default function BlocksImageItemsPage() {
  return (
    <PreviewPage>
      <PreviewSection title="Image" headingLevel="h1" description="An image. That's about it.">
        <BlockVariantPreview preview={<DefaultImageBlockPreview />} />
      </PreviewSection>
    </PreviewPage>
  );
}
