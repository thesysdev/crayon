"use client";

export * from "./components/Accordion";
export * from "./components/AgentInterface";

// DetailedView() factory — generates a ComponentRenderer with detailed-view wiring
export { DetailedView } from "./detailed-view";
export type { DetailedViewConfig, DetailedViewControls } from "./detailed-view";

// ToolMessageRenderer — dispatches tool results to matching AppRenderers
export {
  ToolMessageRenderer,
  type ToolMessageRendererProps,
} from "./components/_shared/tool-renderer";

// Detailed-view exports (DetailedViewPanel/DetailedViewPortalTarget also available as Shell.*)
export { useActiveDetailedView, useDetailedView } from "@openuidev/react-headless";
export {
  DetailedViewOverlay,
  DetailedViewPanel,
  DetailedViewPortalTarget,
} from "./components/_shared/detailed-view";
export type {
  DetailedViewOverlayProps,
  DetailedViewPanelProps,
  DetailedViewPortalTargetProps,
} from "./components/_shared/detailed-view";

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
export * as CopilotShell from "./components/CopilotShell";
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
export * from "./components/MessageLoading";
export * from "./components/OpenUIChat";
export * from "./components/RadioGroup";
export * from "./components/RadioItem";
export * from "./components/SectionBlock";
export * from "./components/Select";
export * from "./components/Separator";
export * as Shell from "./components/Shell";
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
export type { ConversationStarterVariant } from "./components/BottomTray/ConversationStarter";
export type {
  ConversationStarterIcon,
  ConversationStarterProps,
} from "./types/ConversationStarter";
