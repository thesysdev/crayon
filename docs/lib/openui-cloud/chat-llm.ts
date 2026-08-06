import { DEFAULT_MODEL } from "@/lib/openui-cloud/models";
import type { ChatLLM } from "@openuidev/react-headless";
import {
  fetchLLM,
  openAIConversationMessageFormat,
  openAIResponsesAdapter,
} from "@openuidev/react-ui";

interface CloudChatLLM extends ChatLLM {
  setSelectedModel: (model: string) => void;
}

interface CloudChatLLMOptions {
  initialModel?: string;
  shouldSendFullHistory?: (threadId: string) => boolean;
  onFullHistoryAccepted?: (threadId: string) => void;
  onPromptSubmitted?: (observation: CloudChatObservation) => void;
  onGenerationEnd?: (observation: CloudChatGenerationEndObservation) => void;
}

export interface CloudChatObservation {
  threadId: string;
  model: string;
}

export interface CloudChatGenerationEndObservation extends CloudChatObservation {
  outcome: "success" | "failure" | "cancelled";
}

export function createCloudChatLLM(options: CloudChatLLMOptions = {}): CloudChatLLM {
  let selectedModel = options.initialModel ?? DEFAULT_MODEL;
  const llm = fetchLLM({
    url: "/api/openui-cloud/chat",
    streamAdapter: openAIResponsesAdapter(),
    messageFormat: openAIConversationMessageFormat,
    fetch: async (input, init) => {
      const payload = JSON.parse(String(init?.body)) as {
        threadId: string;
        messages: unknown[];
      };
      const shouldSendFullHistory = options.shouldSendFullHistory?.(payload.threadId) ?? false;
      const observation = { threadId: payload.threadId, model: selectedModel };
      options.onPromptSubmitted?.(observation);

      let response: Response;
      try {
        response = await fetch(input, {
          ...init,
          body: JSON.stringify({
            threadId: payload.threadId,
            input: shouldSendFullHistory ? payload.messages : payload.messages.slice(-1),
            model: selectedModel,
          }),
        });
      } catch (error) {
        options.onGenerationEnd?.({
          ...observation,
          outcome: isCancelledRequest(error, init?.signal) ? "cancelled" : "failure",
        });
        throw error;
      }

      if (!response.ok) {
        options.onGenerationEnd?.({ ...observation, outcome: "failure" });
        return response;
      }

      if (shouldSendFullHistory) {
        options.onFullHistoryAccepted?.(payload.threadId);
      }

      return observeGeneration(response, observation, options.onGenerationEnd);
    },
  });

  return {
    ...llm,
    setSelectedModel(model) {
      selectedModel = model;
    },
  };
}

function observeGeneration(
  response: Response,
  observation: CloudChatObservation,
  onGenerationEnd: CloudChatLLMOptions["onGenerationEnd"],
): Response {
  if (!onGenerationEnd || !response.body) return response;

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let sseBuffer = "";
  let finished = false;

  const finish = (outcome: CloudChatGenerationEndObservation["outcome"]) => {
    if (finished) return;
    finished = true;
    onGenerationEnd({ ...observation, outcome });
  };

  const inspect = (text: string) => {
    sseBuffer += text;
    const events = sseBuffer.split(/\r?\n\r?\n/);
    sseBuffer = events.pop() ?? "";

    for (const event of events) {
      const data = event
        .split(/\r?\n/)
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).trimStart())
        .join("\n");
      if (!data || data === "[DONE]") continue;

      try {
        const payload = JSON.parse(data) as { type?: unknown };
        if (payload.type === "response.completed") finish("success");
        if (
          payload.type === "response.failed" ||
          payload.type === "response.incomplete" ||
          payload.type === "error"
        ) {
          finish("failure");
        }
      } catch {
        // The rendering stream remains authoritative; analytics parsing is fail-open.
      }
    }
  };

  const body = new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const { done, value } = await reader.read();
        if (done) {
          inspect(decoder.decode());
          if (!finished) finish("failure");
          controller.close();
          return;
        }

        inspect(decoder.decode(value, { stream: true }));
        controller.enqueue(value);
      } catch (error) {
        finish(isCancelledRequest(error) ? "cancelled" : "failure");
        controller.error(error);
      }
    },
    async cancel(reason) {
      finish("cancelled");
      await reader.cancel(reason);
    },
  });

  return new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}

function isCancelledRequest(error: unknown, signal?: AbortSignal | null): boolean {
  return (
    signal?.aborted === true ||
    (error instanceof DOMException && error.name === "AbortError") ||
    (error instanceof Error && error.name === "AbortError")
  );
}
