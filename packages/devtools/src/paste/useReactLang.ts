import { useEffect, useState } from "react";
import type { LangModule } from "./types";

let pending: Promise<LangModule | null> | null = null;

/**
 * Reads an export that older react-lang builds may not have. Some module
 * namespaces (test mocks, exotic bundlers) throw on a missing export instead of
 * answering undefined, and a throw here would look like react-lang is missing.
 */
function optionalExport<T>(read: () => T | undefined): T | undefined {
  try {
    return read();
  } catch {
    return undefined;
  }
}

export function loadReactLang(): Promise<LangModule | null> {
  pending ??= import("@openuidev/react-lang")
    .then((mod) => {
      const loaded = mod as unknown as Partial<LangModule>;
      if (typeof loaded.createParser !== "function" || !loaded.Renderer) return null;
      return {
        Renderer: loaded.Renderer,
        createParser: loaded.createParser,
        createStreamingParser: optionalExport(() => loaded.createStreamingParser),
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
