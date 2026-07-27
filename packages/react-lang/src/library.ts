import {
  createLibrary as coreCreateLibrary,
  defineComponent as coreDefineComponent,
  type DefinedComponent as CoreDefinedComponent,
  type Library as CoreLibrary,
  type LibraryDefinition as CoreLibraryDefinition,
  type ComponentRenderProps as CoreRenderProps,
} from "@openuidev/lang-core";
import type { ReactNode } from "react";
import type { z } from "zod/v4";
import type { $ZodObject } from "zod/v4/core";

// Re-export framework-agnostic types unchanged
export type {
  ComponentGroup,
  LibraryJSONSchema,
  PromptOptions,
  SubComponentOf,
  ToolDescriptor,
} from "@openuidev/lang-core";

// ─── React-specific types ───────────────────────────────────────────────────

export interface ComponentRenderProps<P = Record<string, unknown>>
  extends CoreRenderProps<P, ReactNode> {}

export type ComponentRenderer<P = Record<string, unknown>> = React.FC<ComponentRenderProps<P>>;

export type DefinedComponent<T extends $ZodObject = $ZodObject> = CoreDefinedComponent<
  T,
  ComponentRenderer<z.infer<T>>
>;

export type Library = CoreLibrary<ComponentRenderer<any>>;

export type LibraryDefinition = CoreLibraryDefinition<ComponentRenderer<any>>;

// ─── defineComponent (React) ────────────────────────────────────────────────

export function defineComponent<T extends $ZodObject>(config: {
  name: string;
  props: T;
  description: string;
  component: ComponentRenderer<z.infer<T>>;
  /** Skeleton shown while this component streams (smooth streaming). Rendered with no props. */
  skeleton?: React.ComponentType;
}): DefinedComponent<T> {
  return coreDefineComponent<T, ComponentRenderer<z.infer<T>>>({
    ...config,
    skeleton: config.skeleton as unknown as ComponentRenderer<z.infer<T>> | undefined,
  });
}

// ─── createLibrary (React) ──────────────────────────────────────────────────

export function createLibrary(
  input: LibraryDefinition & {
    /**
     * Smooth-streaming visuals: a reveal wrapper (fade/height easing) and a
     * slot skeleton. See RevealComponentProps / SlotComponentProps in Renderer.
     * Provided by the component library so react-lang stays platform-neutral.
     */
    streamingComponents?: { reveal?: React.ComponentType<any>; slot?: React.ComponentType<any> };
  },
): Library {
  return coreCreateLibrary<ComponentRenderer<any>>(input) as Library;
}
