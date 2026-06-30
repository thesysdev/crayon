import { createContext, useContext } from "react";
import type { ArtifactCategory } from "../adapters/types";

/** @internal Provided by `ChatProvider` from the `artifactCategories` prop. */
export const ArtifactCategoriesContext = createContext<ArtifactCategory[]>([]);

/**
 * Returns the global artifact categories configured on `<ChatProvider>`.
 * Empty array when none were provided.
 *
 * Categories drive the sidebar Artifacts split, the artifact browser's
 * pre-applied filters, and category-grouped workspace sections.
 *
 * @category Hooks
 */
export const useArtifactCategories = (): ArtifactCategory[] =>
  useContext(ArtifactCategoriesContext);
