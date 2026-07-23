"use client";

export * from "./components/Accordion";
export * from "./components/AgentInterface";

// Adapter factories + types — paired with AgentInterface's `storage` / `llm` props,
// re-exported so consumers can build adapters without reaching into react-headless.
export {
  defineArtifactRenderer,
  fetchLLM,
  pairToolActivity,
  partialJSONParse,
  restStorage,
  useToolActivities,
} from "@openuidev/react-headless";
export type {
  Artifact,
  ArtifactCategory,
  ArtifactListParams,
  ArtifactRendererConfig,
  ArtifactRendererControls,
  ArtifactStorage,
  ArtifactSummary,
  ChatLLM,
  ChatStorage,
  FetchLLMOptions,
  RestStorageOptions,
  ThreadStorage,
  ToolActivity,
  ToolCallStatus,
} from "@openuidev/react-headless";

// Re-export the full headless surface so apps import everything (adapters,
// formats, hooks, storage, message types) from @openuidev/react-ui.
export * from "@openuidev/react-headless";
// `ToolCall` exists in both packages (a message type in react-headless, the
// component here). Pin the component so the two star re-exports don't collide.
export { ToolCall } from "./components/ToolCall";

// Tool-call rendering: the typed-activity dispatchers (matched renderer xor
// default) + the legacy ToolMessageRenderer wrapper.
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
} from "./components/_shared/tool-renderer";

// Shared Collapsible primitive + built-in web-search renderer.
export { Collapsible } from "./components/_shared/Collapsible";

// Detailed-view exports (DetailedViewPanel/DetailedViewPortalTarget)
export { useActiveDetailedView, useDetailedView } from "@openuidev/react-headless";

export * from "./components/Button";
export * from "./components/Buttons";
export * from "./components/Calendar";
export * from "./components/Callout";
export * from "./components/Card";
export * from "./components/CardHeader";
export * from "./components/Carousel";
export * from "./components/Charts";
export type { ExportChartData } from "./components/Charts/Charts";
export * from "./components/CheckBoxGroup";
export * from "./components/CheckBoxItem";
export * from "./components/CodeBlock";
export * from "./components/DatePicker";
export * from "./components/FollowUpBlock";
export * from "./components/FollowUpItem";
export * from "./components/FormControl";
export * from "./components/IconButton";
export * from "./components/Image";
export * from "./components/ImageBlock";
export * from "./components/ImageGallery";
export * from "./components/Input";
export * from "./components/Label";
export * from "./components/ListBlock";
export * from "./components/ListItem";
export * from "./components/MarkDownRenderer";
export * from "./components/OpenUIChat";
export * from "./components/RadioGroup";
export * from "./components/RadioItem";
export * from "./components/SectionBlock";
export * from "./components/Select";
export * from "./components/Separator";
export * from "./components/Skeleton";
export * from "./components/Slider";
export * from "./components/Steps";
export * from "./components/SwitchGroup";
export * from "./components/SwitchItem";
export * from "./components/Table";
export * from "./components/Tabs";
export * from "./components/Tag";
export * from "./components/TagBlock";
export * from "./components/TextArea";
export * from "./components/TextCallout";
export * from "./components/TextContent";
export * from "./components/ThemeProvider";

export * from "./components/ToolCall";
export * from "./components/ToolResult";

// Genui-lib standard library
export {
  openuiAdditionalRules,
  openuiChatAdditionalRules,
  openuiChatComponentGroups,
  openuiChatExamples,
  openuiChatLibrary,
  openuiChatPromptOptions,
  openuiComponentGroups,
  openuiExamples,
  openuiLibrary,
  openuiPromptOptions,
} from "./genui-lib";

// this is the context providers that are used in the shell
export * from "./context/LayoutContext";

export * from "./context/PrintContext";

// Types Export
export type { ConversationStarterVariant } from "./components/AgentInterface/ConversationStarter";
export type {
  ConversationStarterIcon,
  ConversationStarterProps,
} from "./types/ConversationStarter";
export type { PrefillChip } from "./types/PrefillChip";
