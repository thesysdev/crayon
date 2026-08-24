import { requireLoadReactLang } from "./slots";

const mod = (await requireLoadReactLang()) as
  | {
      Renderer?: unknown;
      createParser?: unknown;
      createStreamingParser?: unknown;
    }
  | null
  | undefined;

export const Renderer = mod?.Renderer;
export const createParser = mod?.createParser;
export const createStreamingParser = mod?.createStreamingParser;
