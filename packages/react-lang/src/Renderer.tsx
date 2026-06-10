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
  /**
   * Custom loading indicator shown while queries are fetching. Defaults to a
   * DOM spinner on the web. On non-web hosts (e.g. React Native) the default
   * spinner is skipped — pass your own node here to show a loader.
   */
  queryLoader?: React.ReactNode;
  /**
   * Host element used for the Renderer's outer wrapper.
   *
   * Defaults to `"div"` for the web. On React Native / Expo, lowercase tag
   * names like `"div"` are not valid host components and crash with
   * "View config getter callback for component div ...". Pass a native host
   * (e.g. `View` from `react-native`) so the Renderer mounts native elements:
   *
   * ```tsx
   * import { View } from "react-native";
   * <Renderer containerComponent={View} contentComponent={View} ... />
   * ```
   *
   * The component receives a `style` prop, so it must accept one (both `div`
   * and `View` do).
   */
  containerComponent?: React.ElementType;
  /**
   * Host element used for the inner content wrapper (the one that fades while
   * queries load). Defaults to `"div"`. See {@link containerComponent} for
   * React Native usage.
   */
  contentComponent?: React.ElementType;
  /**
   * Called with structured, LLM-friendly errors from the parser and query system.
   * Only includes errors fixable by changing the openui-lang code (unknown components,
   * missing required props, tool-not-found). Suitable for an automated LLM correction loop.
   * Called with [] when all errors are resolved.
   */
  onError?: (errors: OpenUIError[]) => void;
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
    return value.map((v, i) => <Fragment key={i}>{renderDeep(v)}</Fragment>);
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

const DefaultQueryLoader = () => (
  <div
    style={{
      position: "absolute",
      top: 8,
      right: 8,
      width: 16,
      height: 16,
      border: "2px solid #e5e7eb",
      borderTopColor: "#3b82f6",
      borderRadius: "50%",
      animation: "openui-spin 0.6s linear infinite",
      zIndex: 10,
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
  containerComponent,
  contentComponent,
  onError,
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

  const { result, parseResult, contextValue, isQueryLoading } = useOpenUIState(
    {
      response,
      library,
      isStreaming,
      onAction,
      onStateUpdate,
      initialState,
      toolProvider: resolvedToolProvider,
      onError,
    },
    renderDeep,
  );

  // Fire onParseResult with the RAW parse result (not evaluated),
  // so hosts only see changes when the parser output actually changes.
  useEffect(() => {
    onParseResultRef.current?.(parseResult);
  }, [parseResult]);

  if (!result?.root) {
    return null;
  }

  const Container = containerComponent ?? "div";
  const Content = contentComponent ?? "div";

  // Web host elements are referenced by their string tag ("div"); native hosts
  // (e.g. React Native's View) are component references. CSS transitions and the
  // default DOM spinner are web-only, so only apply them when the wrapper is a
  // web host — passing them to a native View would warn or crash.
  const isWebContent = typeof Content === "string";
  const isWebContainer = typeof Container === "string";

  const contentStyle = isWebContent
    ? { opacity: isQueryLoading ? 0.7 : 1, transition: "opacity 0.2s ease" }
    : { opacity: isQueryLoading ? 0.7 : 1 };

  // Fall back to the DOM spinner only on web hosts. On native, render nothing
  // unless the host supplied its own queryLoader.
  const loader = queryLoader ?? (isWebContainer ? <DefaultQueryLoader /> : null);

  return (
    <OpenUIContext.Provider value={contextValue}>
      <Container style={{ position: "relative" }}>
        {isQueryLoading && loader}
        <Content style={contentStyle}>
          <RenderNode node={result.root} />
        </Content>
      </Container>
    </OpenUIContext.Provider>
  );
}
