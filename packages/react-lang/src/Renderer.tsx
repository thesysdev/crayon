import type {
  ActionEvent,
  ElementNode,
  McpClientLike,
  OpenUIError,
  ParseResult,
  ToolProvider,
} from "@openuidev/lang-core";
import { ToolNotFoundError, extractToolResult } from "@openuidev/lang-core";
import React, { Component, Fragment, useEffect, useInsertionEffect, useRef } from "react";
import { isElementNode } from "@openuidev/lang-core";
import { OpenUIContext, useOpenUI, useRenderNode } from "./context";
import { useOpenUIState } from "./hooks/useOpenUIState";
import type { ComponentRenderer, Library } from "./library";

export interface RendererProps {
  /** Raw response text (openui-lang code). */
  response: string | null;
  /** Component library from createLibrary(). */
  library: Library;
  /** Whether the LLM is still streaming (form interactions disabled during streaming). */
  isStreaming?: boolean;
  /** Callback when a component triggers an action. */
  onAction?: (event: ActionEvent) => void;
  /**
   * Called whenever a form field value changes. Receives the raw form state map.
   * The consumer decides how to persist this (e.g. embed in message, store separately).
   */
  onStateUpdate?: (state: Record<string, unknown>) => void;
  /**
   * Initial form state to hydrate on load (e.g. from a previously persisted message).
   * Shape: { formName: { fieldName: { value, componentType } }, $varName: value }
   * $-prefixed keys are treated as reactive bindings, everything else is form state.
   */
  initialState?: Record<string, any>;
  /** Called whenever the parse result changes. */
  onParseResult?: (result: ParseResult | null) => void;
  /**
   * Tool provider for Query()/Mutation() calls.
   * - Function map: `{ tool_name: async (args) => result }` — simplest option
   * - MCP client: any object with `callTool({ name, arguments })` (e.g. from @modelcontextprotocol/sdk)
   */
  toolProvider?:
    | Record<string, (args: Record<string, unknown>) => Promise<unknown>>
    | McpClientLike
    | null;
  /** Custom loading indicator shown while queries are fetching. Defaults to a spinner. */
  queryLoader?: React.ReactNode;
  /**
   * Called with structured, LLM-friendly errors from the parser and query system.
   * Only includes errors fixable by changing the openui-lang code (unknown components,
   * missing required props, tool-not-found). Suitable for an automated LLM correction loop.
   * Called with [] when all errors are resolved.
   */
  onError?: (errors: OpenUIError[]) => void;
  /**
   * Smooth streaming (default true): reserves layout slots for statements that
   * haven't finished streaming, fades content in with a gentle stagger, and
   * eases height changes — so backfilling data never shoves the layout.
   * Set false for the legacy pop-in behavior.
   */
  smooth?: boolean;
}

// ─── Error boundary ───

interface ErrorBoundaryProps {
  children: React.ReactNode;
  componentName?: string;
  onError?: (error: OpenUIError) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * Error boundary that intentionally shows the last successfully rendered
 * children when a render error occurs. This "show last good state" behavior
 * prevents the UI from going blank during streaming or transient evaluation
 * errors, and auto-recovers when new valid children arrive.
 */
class ElementErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private lastValidChildren: React.ReactNode = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidMount(): void {
    if (!this.state.hasError) {
      this.lastValidChildren = this.props.children;
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    if (!this.state.hasError) {
      this.lastValidChildren = this.props.children;
    }
    if (this.state.hasError && prevProps.children !== this.props.children) {
      this.setState({ hasError: false });
    }
  }

  componentDidCatch(error: Error): void {
    const name = this.props.componentName ?? "Unknown";
    this.props.onError?.({
      source: "runtime",
      code: "render-error",
      component: name,
      message: `Component ${name} render failed: ${error.message}`,
    });
  }

  render() {
    if (this.state.hasError) {
      return this.lastValidChildren;
    }
    return this.props.children;
  }
}

// ─── Smooth streaming: slots & reveal (logic only) ───
// react-lang stays platform-neutral (React Native compatible): the DOM/visual
// implementations are provided by the component library via
// createLibrary({ streamingComponents }). Without them, slots render nothing
// and content renders bare — safe legacy behavior on any platform.

/** Props contract for a library-provided reveal wrapper (fade/ease visuals). */
export interface RevealComponentProps {
  /** The statement-level node being revealed (never a slot). */
  node: ElementNode;
  /** Stagger delay in ms assigned by the reveal pacer. */
  delayMs: number;
  /** False when this node mounted outside streaming (history render) — do not animate. */
  animate: boolean;
  children: React.ReactNode;
}

/** Props contract for a library-provided slot skeleton. */
export interface SlotComponentProps {
  /** The slot placeholder. `typeName` is the target component ("__slot__" if unknown). */
  node: ElementNode;
}

function getStreamingImpls(library: Library) {
  return library.streamingComponents as
    | {
        reveal?: React.ComponentType<RevealComponentProps>;
        slot?: React.ComponentType<SlotComponentProps>;
      }
    | undefined;
}

/**
 * Statement-level child wrapper: assigns the reveal stagger delay and delegates
 * visuals to the library's streaming components. Pure logic — no DOM.
 */
function Reveal({ node }: { node: ElementNode }) {
  const { isStreaming, revealDelay, library } = useOpenUI();
  const isSlot = !!node.slot;

  // Animate entrance only for content that first appears while streaming —
  // persisted messages rendering from history must not animate.
  const bornStreamingRef = useRef(isStreaming);
  const delayRef = useRef<number | null>(null);
  if (!isSlot && delayRef.current == null) {
    delayRef.current =
      bornStreamingRef.current && revealDelay ? revealDelay(node.statementId ?? "") : -1;
  }

  const impls = getStreamingImpls(library);

  if (isSlot) {
    if (!isStreaming || !revealDelay) return null;
    const Slot = impls?.slot;
    return Slot ? <Slot node={node} /> : null;
  }

  const content = <RenderNode node={node} />;
  const RevealImpl = impls?.reveal;
  if (!revealDelay || !RevealImpl) return content;
  const delay = delayRef.current ?? -1;
  return (
    <RevealImpl node={node} delayMs={Math.max(0, delay)} animate={delay >= 0}>
      {content}
    </RevealImpl>
  );
}

// ─── Internal rendering ───

/**
 * Recursively renders a parsed value (element, array, primitive)
 * into React nodes.
 */
function renderDeep(value: unknown): React.ReactNode {
  if (value == null) return null;
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return String(value);

  if (Array.isArray(value)) {
    // Statement-level children get identity keys (statementId + occurrence for
    // shared refs) and a Reveal wrapper; everything else keeps index keys.
    const seen = new Map<string, number>();
    return value.map((v, i) => {
      if (isElementNode(v) && v.statementId) {
        const n = seen.get(v.statementId) ?? 0;
        seen.set(v.statementId, n + 1);
        const key = n ? `${v.statementId}#${n}` : v.statementId;
        return <Reveal key={key} node={v} />;
      }
      return <Fragment key={`i${i}`}>{renderDeep(v)}</Fragment>;
    });
  }

  if (typeof value === "object" && value !== null) {
    const obj = value as Record<string, unknown>;
    if (obj.type === "element") {
      return <RenderNode node={obj as unknown as ElementNode} />;
    }
  }

  return null;
}

/**
 * Renders a single ElementNode.
 */
function RenderNode({ node }: { node: ElementNode }) {
  const { library, reportError } = useOpenUI();
  const Comp = library.components[node.typeName]?.component;

  // Slot placeholders must never reach real components (their props are empty).
  if (node.slot) {
    const Slot = getStreamingImpls(library)?.slot;
    return Slot ? <Slot node={node} /> : null;
  }
  if (!Comp) return null;

  return (
    <ElementErrorBoundary componentName={node.typeName} onError={reportError}>
      <RenderNodeInner el={node} Comp={Comp} />
    </ElementErrorBoundary>
  );
}

/**
 * Renders a resolved element using its renderer.
 * Props are already evaluated by evaluate-tree — no AST awareness needed.
 */
function RenderNodeInner({ el, Comp }: { el: ElementNode; Comp: ComponentRenderer<any> }) {
  const renderNode = useRenderNode();
  return <Comp props={el.props} renderNode={renderNode} statementId={el.statementId} />;
}

// ─── Loading style injection (once per document) ───

let loadingStyleInjected = false;
function ensureLoadingStyle() {
  if (loadingStyleInjected || typeof document === "undefined") return;
  loadingStyleInjected = true;
  const style = document.createElement("style");
  style.textContent = `@keyframes openui-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`;
  document.head.appendChild(style);
}

// ─── Public component ───

// Placement (absolute, top-right) is owned by the Renderer's overlay wrapper —
// this is just the visual.
const DefaultQueryLoader = () => (
  <div
    style={{
      width: 16,
      height: 16,
      border: "2px solid #e5e7eb",
      borderTopColor: "#3b82f6",
      borderRadius: "50%",
      animation: "openui-spin 0.6s linear infinite",
    }}
  />
);

export function Renderer({
  response,
  library,
  isStreaming = false,
  onAction,
  onStateUpdate,
  initialState,
  onParseResult,
  toolProvider,
  queryLoader,
  onError,
  smooth = true,
}: RendererProps) {
  useInsertionEffect(() => {
    ensureLoadingStyle();
  }, []);

  const onParseResultRef = useRef(onParseResult);
  onParseResultRef.current = onParseResult;

  // Stable ToolProvider wrapper — identity never changes, so QueryManager
  // is created once. callTool() reads the latest input from a ref on every
  // call, so function map updates, closure changes, and provider swaps
  // are always observed without triggering re-creation.
  const toolProviderInputRef = useRef(toolProvider);
  toolProviderInputRef.current = toolProvider;

  const stableToolProvider = useRef<ToolProvider>({
    async callTool(toolName: string, args: Record<string, unknown>): Promise<unknown> {
      const current = toolProviderInputRef.current ?? null;
      if (current == null) throw new Error("[openui] toolProvider is null");
      // MCP client — has callTool({ name, arguments }) returning MCP envelope
      if (typeof (current as McpClientLike).callTool === "function") {
        const result = await (current as McpClientLike).callTool({
          name: toolName,
          arguments: args,
        });
        return extractToolResult(result);
      }
      // Function map — plain object of async functions
      const map = current as Record<string, (a: Record<string, unknown>) => Promise<unknown>>;
      const fn = map[toolName];
      if (!fn) throw new ToolNotFoundError(toolName, Object.keys(map));
      return fn(args);
    },
  });
  const resolvedToolProvider = toolProvider != null ? stableToolProvider.current : null;

  const { result, resultIsFresh, parseResult, contextValue, isQueryLoading } = useOpenUIState(
    {
      response,
      library,
      isStreaming,
      onAction,
      onStateUpdate,
      initialState,
      toolProvider: resolvedToolProvider,
      onError,
      smooth,
    },
    renderDeep,
  );

  // Fire onParseResult with the RAW parse result (not evaluated),
  // so hosts only see changes when the parser output actually changes.
  useEffect(() => {
    onParseResultRef.current?.(parseResult);
  }, [parseResult]);

  // Last-good tree: once something has rendered, a transiently null root
  // mid-stream must never blank the UI. Reset when a new stream begins
  // (response no longer extends the previous one).
  const lastGoodRootRef = useRef<ElementNode | null>(null);
  const prevResponseRef = useRef<string>("");
  const resp = response ?? "";
  if (resp.length < prevResponseRef.current.length || !resp.startsWith(prevResponseRef.current)) {
    lastGoodRootRef.current = null;
  }
  prevResponseRef.current = resp;
  // Only fresh parses may render or be captured — a stale result from before a
  // reset must never resurrect the previous stream's tree.
  const freshRoot = resultIsFresh ? (result?.root ?? null) : null;
  if (freshRoot) lastGoodRootRef.current = freshRoot;

  const rootNode = freshRoot ?? (isStreaming && smooth ? lastGoodRootRef.current : null);
  if (!rootNode) {
    return null;
  }

  return (
    <OpenUIContext.Provider value={contextValue}>
      <div style={{ position: "relative" }}>
        {/* Overlayed (absolute) so a refetch NEVER displaces the tree — an
            in-flow loader pushed the whole UI down by its height on every
            filter change, then snapped back when data settled. The opacity
            dim below is the primary loading affordance. */}
        {isQueryLoading && (
          <div
            style={{
              position: "absolute",
              top: 4,
              right: 8,
              zIndex: 10,
              pointerEvents: "none",
            }}
          >
            {queryLoader ?? <DefaultQueryLoader />}
          </div>
        )}
        <div style={{ opacity: isQueryLoading ? 0.7 : 1, transition: "opacity 0.2s ease" }}>
          <RenderNode node={rootNode} />
        </div>
      </div>
    </OpenUIContext.Provider>
  );
}
