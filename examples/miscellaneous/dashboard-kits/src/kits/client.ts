"use client";

import type { Library } from "@openuidev/react-lang";
import { analyticsLibrary, ecommerceLibrary } from "./libraries";

export { createToolProvider } from "@openuidev/dashboard-kits";
export type { ToolCall } from "@openuidev/dashboard-kits";

export const KIT_LIBRARIES: Record<string, Library> = {
  ecommerce: ecommerceLibrary,
  analytics: analyticsLibrary,
};
