"use client";

import {
  defineArtifactRenderer,
  type ArtifactCategory,
  type ArtifactRendererControls,
} from "@openuidev/react-headless";
import { ArtifactActual, ArtifactPreview } from "./ArtifactComponents";
import { artifactParser, type ArtifactProps } from "./parseArtifact";

/**
 * The backend's artifact tool function names — the toolName routing seam.
 * 'thesys_get_artifact_description' is intentionally NOT registered (its result
 * is prose for the model and should keep the default tool chip).
 */
export const ARTIFACT_TOOL_NAMES = ["thesys_generate_artifact", "thesys_edit_artifact"] as const;

const shared = {
  parser: artifactParser,
  preview: (props: ArtifactProps, controls: ArtifactRendererControls) => (
    <ArtifactPreview props={props} controls={controls} />
  ),
  actual: (props: ArtifactProps) => <ArtifactActual props={props} />,
};

/**
 * Owns the toolName route. One tool serves both kinds and the registry is
 * first-wins per toolName, so this single config takes the tool names and the
 * shared parser branches on the envelope's type.
 */
export const presentationArtifactRenderer = defineArtifactRenderer<ArtifactProps>({
  type: "presentation",
  toolName: [...ARTIFACT_TOOL_NAMES],
  ...shared,
});

/**
 * byType registration only (the artifact browser resolves stored reports by
 * type). toolName: [] registers nothing in the toolName map.
 */
export const reportArtifactRenderer = defineArtifactRenderer<ArtifactProps>({
  type: "report",
  toolName: [],
  ...shared,
});

/** Pass to <AgentInterface artifactRenderers={artifactRenderers}>.
 *  Order matters: presentation first (it owns the tool names). */
export const artifactRenderers = [presentationArtifactRenderer, reportArtifactRenderer];

/**
 * One category covering both kinds. Live tool-call registrations are stamped
 * with the matched config's type (always 'presentation', which owns the tool
 * names); a single category keeps that invisible in the artifact browser rail.
 */
export const artifactCategories: ArtifactCategory[] = [
  { name: "Artifacts", filter: { type: ["presentation", "report"] } },
];
