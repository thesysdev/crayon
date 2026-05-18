import { createContext, useContext } from "react";
import type { AppRendererConfig } from "./appRendererTypes";

/**
 * Pre-built lookup structure for AppRenderer matching.
 *
 * Built once at `ChatProvider` mount from the user-supplied `appRenderers` array.
 * Subsequent prop changes are ignored (with a dev-mode warning) so renderer
 * registration stays stable for the lifetime of the provider.
 *
 * @internal
 */
export type AppRendererRegistry = {
  /** Configs whose `toolName` is a literal string, indexed for O(1) lookup. */
  literal: Map<string, AppRendererConfig<unknown>>;
  /** Configs whose `toolName` is a `RegExp`, scanned linearly as a fallback. */
  regex: AppRendererConfig<unknown>[];
};

/**
 * Builds an {@link AppRendererRegistry} from a list of configs.
 *
 * - Splits literal-toolName configs into a Map for O(1) lookup, regex configs into an array.
 * - First-wins on duplicate literal `toolName`: subsequent registrations are ignored.
 * - In development, logs a warning when a duplicate is dropped so the user can
 *   reorder their array (custom renderers should come *before* SDK defaults).
 *
 * @internal
 */
export function buildAppRendererRegistry(
  configs: ReadonlyArray<AppRendererConfig<any>>,
): AppRendererRegistry {
  const literal = new Map<string, AppRendererConfig<unknown>>();
  const regex: AppRendererConfig<unknown>[] = [];

  for (const config of configs) {
    if (typeof config.toolName === "string") {
      if (literal.has(config.toolName)) {
        if (typeof process !== "undefined" && process.env?.["NODE_ENV"] !== "production") {
          console.warn(
            `[OpenUI] AppRenderer for toolName "${config.toolName}" was ignored ` +
              `(already registered earlier in the array).`,
          );
        }
        continue;
      }
      literal.set(config.toolName, config);
    } else {
      regex.push(config);
    }
  }

  return { literal, regex };
}

/**
 * Resolves the AppRenderer config matching a given `toolName`, or `null` if none match.
 *
 * Lookup order:
 * 1. Literal-toolName map (O(1))
 * 2. Regex configs scanned in array order; first match wins
 *
 * In development, after finding a match the function continues scanning to detect
 * ambiguity (e.g., a literal config and a regex config that both match the same
 * tool name) and logs a warning. Production short-circuits on first hit.
 *
 * @internal
 */
export function lookupAppRenderer(
  registry: AppRendererRegistry,
  toolName: string,
): AppRendererConfig<unknown> | null {
  const literal = registry.literal.get(toolName);

  if (typeof process !== "undefined" && process.env?.["NODE_ENV"] !== "production") {
    const matches: AppRendererConfig<unknown>[] = [];
    if (literal) matches.push(literal);
    for (const r of registry.regex) {
      if (r.toolName instanceof RegExp && r.toolName.test(toolName)) {
        matches.push(r);
      }
    }
    if (matches.length > 1) {
      console.warn(
        `[OpenUI] Multiple AppRenderers match toolName "${toolName}". ` +
          `Using the first (${String(matches[0]!.toolName)}); ignoring ${matches.length - 1} other(s). ` +
          `Reorder your appRenderers array to control priority.`,
      );
    }
  }

  if (literal) return literal;

  for (const r of registry.regex) {
    if (r.toolName instanceof RegExp && r.toolName.test(toolName)) {
      return r;
    }
  }

  return null;
}

/** @internal React context holding the AppRenderer registry. Provided by `ChatProvider`. */
export const AppRenderersContext = createContext<AppRendererRegistry | null>(null);

/**
 * Returns the raw AppRenderer registry for advanced use cases.
 *
 * Prefer {@link useAppRenderer} for resolving a specific tool name —
 * this hook is an escape hatch for custom dispatching.
 *
 * Returns `null` if no `appRenderers` were provided to the `<ChatProvider>` —
 * this is not an error since AppRenderers are optional.
 *
 * @category Hooks
 */
export const useAppRendererRegistry = (): AppRendererRegistry | null => {
  return useContext(AppRenderersContext);
};
