"use client";

import {
  defineArtifactRenderer,
  partialJSONParse,
  useThread,
  type ArtifactRendererConfig,
  type CreateToolResult,
} from "@openuidev/react-headless";
import { BuiltinActionType, Renderer, type ActionEvent, type Library } from "@openuidev/react-lang";
import { openuiChatLibrary } from "@openuidev/react-ui";
import { useCallback, useMemo, useRef } from "react";

export const AGNO_OPENUI_PROMPT_TOOL_NAME = "prompt_openui";

export interface AgnoOpenUIActionResult {
  type: BuiltinActionType.ContinueConversation;
  message: string;
  params: Record<string, unknown>;
  formState?: Record<string, unknown>;
  formName?: string;
}

interface OpenUIToolProps {
  ui: string;
  result?: AgnoOpenUIActionResult;
}

export interface CreateAgnoOpenUIPromptRendererOptions {
  /** Exact library described to the AgentOS model. Defaults to openuiChatLibrary. */
  library?: Library;
  /** Backend external-execution tool name. Defaults to prompt_openui. */
  toolName?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseActionResult(value: unknown): AgnoOpenUIActionResult | undefined {
  let parsed = value;
  if (typeof value === "string") {
    try {
      parsed = JSON.parse(value);
    } catch {
      return undefined;
    }
  }
  if (!isRecord(parsed) || typeof parsed["message"] !== "string") return undefined;

  return {
    type: BuiltinActionType.ContinueConversation,
    message: parsed["message"],
    params: isRecord(parsed["params"]) ? parsed["params"] : {},
    ...(isRecord(parsed["formState"]) ? { formState: parsed["formState"] } : {}),
    ...(typeof parsed["formName"] === "string" ? { formName: parsed["formName"] } : {}),
  };
}

export function parseAgnoOpenUIPrompt(raw: {
  args: unknown;
  response: unknown;
}): OpenUIToolProps | null {
  const parsedArgs = typeof raw.args === "string" ? partialJSONParse(raw.args) : raw.args;
  if (!isRecord(parsedArgs) || typeof parsedArgs["ui"] !== "string") return null;

  const ui = parsedArgs["ui"];
  if (ui.length === 0) return null;

  const result = parseActionResult(raw.response);
  return { ui, ...(result ? { result } : {}) };
}

function PromptOpenUI({
  ui,
  result,
  library,
  toolCallId,
}: OpenUIToolProps & { library: Library; toolCallId?: string }) {
  const isRunning = useThread((state) => state.isRunning);
  const processToolResult = useThread((state) => state.processToolResult);
  const completed = useRef(result !== undefined);

  const initialState = useMemo(() => result?.formState, [result?.formState]);

  const handleAction = useCallback(
    (event: ActionEvent) => {
      if (
        !toolCallId ||
        result !== undefined ||
        completed.current ||
        event.type !== BuiltinActionType.ContinueConversation
      ) {
        if (event.type === BuiltinActionType.OpenUrl) {
          const url = event.params?.["url"];
          if (typeof window !== "undefined" && typeof url === "string") {
            window.open(url, "_blank", "noopener,noreferrer");
          }
        }
        return;
      }

      completed.current = true;
      const actionResult: AgnoOpenUIActionResult = {
        type: BuiltinActionType.ContinueConversation,
        message: event.humanFriendlyMessage,
        params: event.params,
        ...(event.formState !== undefined && { formState: event.formState }),
        ...(event.formName !== undefined && { formName: event.formName }),
      };
      const toolResult: CreateToolResult = {
        toolCallId,
        content: JSON.stringify(actionResult),
      };
      void processToolResult(toolResult);
    },
    [processToolResult, result, toolCallId],
  );

  return (
    <Renderer
      response={ui}
      library={library}
      isStreaming={isRunning && result === undefined}
      onAction={handleAction}
      {...(initialState !== undefined && { initialState })}
    />
  );
}

/**
 * Render Agno's external-execution prompt_openui tool inside AgentInterface.
 * An @ToAssistant action becomes a trailing AG-UI ToolMessage, which resumes
 * the paused AgentOS run in the same thread/session.
 */
export function createAgnoOpenUIPromptRenderer({
  library = openuiChatLibrary,
  toolName = AGNO_OPENUI_PROMPT_TOOL_NAME,
}: CreateAgnoOpenUIPromptRendererOptions = {}): ArtifactRendererConfig<OpenUIToolProps> {
  return defineArtifactRenderer<OpenUIToolProps>({
    type: "openui_prompt",
    toolName,
    parser: (raw) => {
      const props = parseAgnoOpenUIPrompt(raw);
      return props ? { props, meta: null } : null;
    },
    preview: (props, controls) => (
      <PromptOpenUI {...props} library={library} toolCallId={controls.toolCallId} />
    ),
    actual: () => null,
  });
}

export const agnoOpenUIPromptRenderer = createAgnoOpenUIPromptRenderer();
