import { observability, type ObservabilityEvent } from "@openuidev/observability";
import { useEffect, useState } from "react";

/**
 * Shared with `@openuidev/react-lang` via `Symbol.for`. Not a public API.
 * Keep the string in sync with `packages/react-lang/src/publishLibrary.ts`.
 */
const DEVTOOLS_LIBRARIES_KEY = Symbol.for("openui.devtools.libraries");

export const LIBRARY_EVENT_KIND = "react-lang:library";

/** Structural slice of a `createLibrary()` result — enough to label, parse, and render. */
export interface LibraryLike {
  id?: string;
  root?: string;
  /** Instance id minted by `createLibrary()`. */
  __libraryId?: string;
  components: Record<string, unknown>;
  toJSONSchema?: () => unknown;
}

export interface RegisteredLibrary {
  key: string;
  library: LibraryLike;
}

interface RegistryStore {
  [DEVTOOLS_LIBRARIES_KEY]?: Record<string, LibraryLike>;
}

export function isLibraryEvent(event: ObservabilityEvent): boolean {
  return event.detail.kind === LIBRARY_EVENT_KIND;
}

export function readRegisteredLibraries(): RegisteredLibrary[] {
  const byKey = (globalThis as RegistryStore)[DEVTOOLS_LIBRARIES_KEY] ?? {};
  return Object.entries(byKey).map(([key, library]) => ({ key, library }));
}

/** Live `createLibrary()` results, seeded from the stash and refreshed on ping. */
export function useRegisteredLibraries(): RegisteredLibrary[] {
  const [libraries, setLibraries] = useState(readRegisteredLibraries);

  useEffect(() => {
    setLibraries(readRegisteredLibraries());
    return observability.listenAll((event) => {
      if (isLibraryEvent(event)) setLibraries(readRegisteredLibraries());
    });
  }, []);

  return libraries;
}
