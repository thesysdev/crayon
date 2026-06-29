// The AgentInterface tool-renderer now re-exports the single canonical module
// (the two byte-near-identical copies were collapsed into one). AgentInterface's
// threads inject their own detailed-view panel where needed.
export {
  TimelineEntry,
  ToolActivityRenderer,
  ToolCallEntry,
  ToolCallErrorFallback,
  ToolMessageRenderer,
  type TimelineEntryProps,
  type ToolCallEntryProps,
  type ToolDetailedViewPanel,
  type ToolMessageRendererProps,
} from "../../../_shared/tool-renderer";
