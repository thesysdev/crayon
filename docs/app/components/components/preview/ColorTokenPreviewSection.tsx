import type { ComponentProps } from "react";
import PreviewSwatchesSection from "@components/components/preview/PreviewSwatchesSection";

type ColorTokenPreviewSectionProps = ComponentProps<typeof PreviewSwatchesSection>;

export default function ColorTokenPreviewSection(props: ColorTokenPreviewSectionProps) {
  return <PreviewSwatchesSection {...props} />;
}
