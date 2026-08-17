import { useEffect, useState } from "react";
import type { LangModule } from "./types";

let pending: Promise<LangModule | null> | null = null;

export function loadReactLang(): Promise<LangModule | null> {
  pending ??= import("@openuidev/react-lang")
    .then((mod) => {
      const loaded = mod as unknown as Partial<LangModule> & { LANG_CORE_VERSION?: string };
      if (typeof loaded.createParser !== "function" || !loaded.Renderer) return null;
      return {
        Renderer: loaded.Renderer,
        createParser: loaded.createParser,
        createStreamingParser: loaded.createStreamingParser,
        langCoreVersion:
          typeof loaded.LANG_CORE_VERSION === "string" ? loaded.LANG_CORE_VERSION : null,
      };
    })
    .catch(() => null);
  return pending;
}

export function useReactLang(): LangModule | null | undefined {
  const [mod, setMod] = useState<LangModule | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    loadReactLang().then((next) => {
      if (!cancelled) setMod(next);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return mod;
}
