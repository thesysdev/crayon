"use client";

import {
  CursorIcon,
  DatabaseIcon,
  DownloadSimpleIcon,
  LightningIcon,
  PlayIcon,
} from "@phosphor-icons/react";
import { FeaturesSection } from "../sections/FeaturesSection/FeaturesSection";

const ICON_SIZE = 18;

const AGENT_FEATURES = [
  {
    title: "High-performance runtime",
    description: "Fast, responsive agent experiences.",
    icon: <LightningIcon size={ICON_SIZE} weight="fill" />,
  },
  {
    title: "Drop-in workspace",
    description: "Add a complete agent interface quickly.",
    icon: <DownloadSimpleIcon size={ICON_SIZE} weight="fill" />,
  },
  {
    title: "State management",
    description: "Persist conversations, artifacts, and UI state.",
    icon: <DatabaseIcon size={ICON_SIZE} weight="fill" />,
  },
  {
    title: "Action handling",
    description: "Approve and trigger actions in the UI.",
    icon: <CursorIcon size={ICON_SIZE} weight="fill" />,
  },
  {
    title: "Streaming support",
    description: "Stream responses and UI updates live.",
    icon: <PlayIcon size={ICON_SIZE} weight="fill" />,
  },
];

export function AgentFeatures() {
  return <FeaturesSection features={AGENT_FEATURES} showCta={false} />;
}
