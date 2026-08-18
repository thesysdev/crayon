// Stands in for "@openuidev/react-lang". paste/useReactLang.ts does
// `import("@openuidev/react-lang")` and reads Renderer/createParser/
// createStreamingParser/LANG_CORE_VERSION off the resolved module — it's
// unmodified between the npm and browser builds. Here that import resolves
// to this module instead of a bundled copy; the top-level await defers
// evaluation until the host's loadReactLang() (injected via mount()) settles,
// so the shape below is exactly what a real @openuidev/react-lang import
// would have produced.
import { slot } from "./slots";

const mod = (await slot.loadReactLang?.()) as
  | {
      Renderer?: unknown;
      createParser?: unknown;
      createStreamingParser?: unknown;
      LANG_CORE_VERSION?: string;
    }
  | null
  | undefined;

export const Renderer = mod?.Renderer;
export const createParser = mod?.createParser;
export const createStreamingParser = mod?.createStreamingParser;
export const LANG_CORE_VERSION = mod?.LANG_CORE_VERSION;
