export enum ThinkItemType {
  TOOL_CALL = "TOOL_CALL",
  WEB_SEARCH = "WEB_SEARCH",
  PLAIN_TEXT = "PLAIN_TEXT",
  ERROR = "ERROR",
}

export interface ThinkItemBase {
  id?: string;
}

export interface ToolCallThinkItemData extends ThinkItemBase {
  toolName: string;
  toolCallTitle?: string;
  toolRequest?: string;
  toolResponse?: string;
  reasoning?: string;
  isError?: string;
}

export interface WebSearchThinkItemData extends ThinkItemBase {
  searchQuery: string;
  sources: WebSearchSource[];
  reasoning?: string;
  isError?: string;
  errorMessage?: string;
}

export interface WebSearchSource {
  sourceLogoSrc?: string;
  sourceTitle: string;
  sourceDescription: string;
  sourceUrl: string;
}

export interface PlainTextThinkItemData extends ThinkItemBase {
  text: string;
}

export interface ErrorThinkItemData extends ThinkItemBase {
  errorMessage: string;
}

export type ThinkItem =
  | { type: ThinkItemType.TOOL_CALL; data: ToolCallThinkItemData }
  | { type: ThinkItemType.WEB_SEARCH; data: WebSearchThinkItemData }
  | { type: ThinkItemType.PLAIN_TEXT; data: PlainTextThinkItemData }
  | { type: ThinkItemType.ERROR; data: ErrorThinkItemData };
