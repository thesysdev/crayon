"use client";

import {
  useAgent,
  useCopilotKit,
  type ReactFrontendTool,
  type ReactHumanInTheLoop,
} from "@copilotkit/react-core/v2";
import {
  BuiltinActionType,
  Renderer,
  type ActionEvent,
  type Library,
  type OpenUIError,
  type RendererProps,
} from "@openuidev/react-lang";
import { openuiChatLibrary, ThemeProvider, type ThemeProps } from "@openuidev/react-ui";
import { useCallback, useRef, useState, type ComponentProps, type ComponentType } from "react";

export interface OpenUIToolArgs extends Record<string, unknown> {
  /** Partial while CopilotKit streams arguments; required by the registered Zod schema. */
  ui?: string;
}

export interface OpenUIPresentResult {
  displayed: true;
}

export interface OpenUIActionResult {
  type: BuiltinActionType.ContinueConversation;
  message: string;
  params: Record<string, unknown>;
  formState?: Record<string, unknown>;
  formName?: string;
}

export type OpenUIErrorFallback = ComponentType<{
  errors: readonly OpenUIError[];
}>;

export type OpenUIRendererProps = Omit<
  RendererProps,
  "response" | "library" | "isStreaming" | "initialState" | "onAction" | "onError"
>;

export interface OpenUIToolUIOptions {
  library?: Library;
  rendererProps?: OpenUIRendererProps;
  /** Theme props passed to <ThemeProvider>. */
  theme?: ThemeProps;
  /** When true, skips wrapping in <ThemeProvider>. */
  disableThemeProvider?: boolean;
  ErrorFallback?: OpenUIErrorFallback | null;
  onError?: (errors: OpenUIError[]) => void;
}

export interface OpenUIContentProps extends OpenUIToolUIOptions {
  response: string;
  isStreaming: boolean;
  initialState?: Record<string, unknown>;
  onAction?: (event: ActionEvent) => void;
}

export const DefaultOpenUIErrorFallback: OpenUIErrorFallback = () => (
  <div role="alert">OpenUI could not render this response.</div>
);

export function OpenUIContent({
  response,
  isStreaming,
  initialState,
  onAction,
  library = openuiChatLibrary,
  rendererProps,
  theme,
  disableThemeProvider,
  ErrorFallback = DefaultOpenUIErrorFallback,
  onError,
}: OpenUIContentProps) {
  const [errors, setErrors] = useState<OpenUIError[]>([]);
  const handleError = useCallback(
    (nextErrors: OpenUIError[]) => {
      setErrors(nextErrors);
      onError?.(nextErrors);
    },
    [onError],
  );

  const content = (
    <>
      <Renderer
        {...rendererProps}
        response={response}
        library={library}
        isStreaming={isStreaming}
        onError={handleError}
        {...(initialState !== undefined && { initialState })}
        {...(onAction !== undefined && { onAction })}
      />
      {!isStreaming && errors.length > 0 && ErrorFallback !== null && (
        <ErrorFallback errors={errors} />
      )}
    </>
  );

  return disableThemeProvider ? content : <ThemeProvider {...theme}>{content}</ThemeProvider>;
}

type PresentRenderComponent = NonNullable<ReactFrontendTool<OpenUIToolArgs>["render"]>;
type PromptRenderComponent = ReactHumanInTheLoop<OpenUIToolArgs>["render"];

export type OpenUIPresentProps = ComponentProps<PresentRenderComponent> &
  OpenUIToolUIOptions & {
    agentId?: string;
  };

export function OpenUIPresent({ args, status, agentId, ...options }: OpenUIPresentProps) {
  const { agent } = useAgent(agentId === undefined ? undefined : { agentId });
  const { copilotkit } = useCopilotKit();
  const continuing = useRef(false);

  const onAction = useCallback(
    (event: ActionEvent) => {
      if (event.type === BuiltinActionType.ContinueConversation) {
        if (continuing.current || agent.isRunning) return;

        continuing.current = true;
        agent.addMessage({
          id: crypto.randomUUID(),
          role: "user",
          content: event.humanFriendlyMessage,
        });
        void copilotkit
          .runAgent({ agent })
          .catch((error: unknown) => {
            console.error("OpenUI could not continue the CopilotKit agent run.", error);
          })
          .finally(() => {
            continuing.current = false;
          });
      } else if (event.type === BuiltinActionType.OpenUrl) {
        const url = event.params?.["url"];
        if (typeof window !== "undefined" && typeof url === "string") {
          window.open(url, "_blank", "noopener,noreferrer");
        }
      }
    },
    [agent, copilotkit],
  );

  return (
    <OpenUIContent
      {...options}
      response={args.ui ?? ""}
      isStreaming={status === "inProgress"}
      onAction={onAction}
    />
  );
}

export type OpenUIPromptProps = ComponentProps<PromptRenderComponent> & OpenUIToolUIOptions;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseOpenUIActionResult(
  result: string | undefined,
): OpenUIActionResult | undefined {
  if (result === undefined || result.length === 0) return undefined;

  try {
    const value: unknown = JSON.parse(result);
    if (
      !isRecord(value) ||
      value["type"] !== BuiltinActionType.ContinueConversation ||
      typeof value["message"] !== "string" ||
      !isRecord(value["params"])
    ) {
      return undefined;
    }

    return value as unknown as OpenUIActionResult;
  } catch {
    return undefined;
  }
}

export function OpenUIPrompt({ args, status, result, respond, ...options }: OpenUIPromptProps) {
  const completed = useRef(status === "complete");
  const parsedResult = parseOpenUIActionResult(result);

  const onAction = (event: ActionEvent) => {
    if (
      status !== "executing" ||
      respond === undefined ||
      completed.current ||
      event.type !== BuiltinActionType.ContinueConversation
    ) {
      return;
    }

    completed.current = true;
    void respond({
      type: BuiltinActionType.ContinueConversation,
      message: event.humanFriendlyMessage,
      params: event.params,
      ...(event.formState !== undefined && { formState: event.formState }),
      ...(event.formName !== undefined && { formName: event.formName }),
    }).catch((error: unknown) => {
      completed.current = false;
      console.error("OpenUI could not submit the CopilotKit human-in-the-loop result.", error);
    });
  };

  return (
    <OpenUIContent
      {...options}
      response={args.ui ?? ""}
      isStreaming={status === "inProgress"}
      onAction={onAction}
      {...(parsedResult?.formState !== undefined && {
        initialState: parsedResult.formState,
      })}
    />
  );
}

export interface CreateOpenUIPresentOptions extends OpenUIToolUIOptions {
  agentId?: string;
}

export function createOpenUIPresent(
  options: CreateOpenUIPresentOptions = {},
): PresentRenderComponent {
  return function ConfiguredOpenUIPresent(props) {
    return <OpenUIPresent {...props} {...options} />;
  };
}

export function createOpenUIPrompt(options: OpenUIToolUIOptions = {}): PromptRenderComponent {
  return function ConfiguredOpenUIPrompt(props) {
    return <OpenUIPrompt {...props} {...options} />;
  };
}
