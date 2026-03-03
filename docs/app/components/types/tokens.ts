import type { CSSProperties, ReactNode } from "react";

export type ThemeMode = "light" | "dark";

export type HeadingLevel = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

export interface TableColumn {
  key: string;
  label: string;
}

export interface ColorTokenItem {
  token: string;
  useCase?: string;
  label?: string;
  className?: string;
}

export interface SwatchToken {
  token: string;
  label?: string;
  value?: string;
  tone?: "light" | "dark";
}

export type SwatchInput = string | SwatchToken;

export interface SwatchRow {
  id?: string;
  title?: string;
  description?: string;
  tokens?: SwatchInput[];
}

export interface FoundationTokenItem {
  token: string;
  value?: string;
  key?: string;
}

export interface TypographyPreviewItem {
  token: string;
  preview: string;
  className?: string;
  style?: CSSProperties;
}

export interface TypographyRow {
  token: string;
  sample: string;
  key?: string;
}

export interface BlockVariantConfig {
  title?: string;
  description?: string;
  preview?: ReactNode;
  prompt?: ReactNode | string;
  promptTitle?: string;
}
