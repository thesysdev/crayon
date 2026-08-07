import { convertToModelMessages, type UIMessage } from "ai";
import { describe, expect, it } from "vitest";
import { vercelAIMessageFormat } from "../../../index";
import type { Message } from "../../../types";

describe("vercelAIMessageFormat", () => {
  describe("toApi", () => {
    it("converts user text to a UIMessage text part", () => {
      expect(
        vercelAIMessageFormat.toApi([{ id: "user-1", role: "user", content: "Hello" }]),
      ).toEqual([{ id: "user-1", role: "user", parts: [{ type: "text", text: "Hello" }] }]);
    });

    it("converts AG-UI multimodal content to UIMessage file parts", () => {
      const messages: Message[] = [
        {
          id: "user-1",
          role: "user",
          content: [
            { type: "text", text: "Describe these" },
            {
              type: "binary",
              mimeType: "image/png",
              data: "iVBORw0KGgo=",
              filename: "chart.png",
            },
            {
              type: "binary",
              mimeType: "application/pdf",
              url: "https://example.com/report.pdf",
              filename: "report.pdf",
            },
            {
              type: "audio",
              source: { type: "data", value: "YXVkaW8=", mimeType: "audio/mpeg" },
            },
            {
              type: "video",
              source: { type: "url", value: "https://example.com/demo.mp4" },
            },
          ],
        },
      ];

      expect(vercelAIMessageFormat.toApi(messages)).toEqual([
        {
          id: "user-1",
          role: "user",
          parts: [
            { type: "text", text: "Describe these" },
            {
              type: "file",
              mediaType: "image/png",
              url: "data:image/png;base64,iVBORw0KGgo=",
              filename: "chart.png",
            },
            {
              type: "file",
              mediaType: "application/pdf",
              url: "https://example.com/report.pdf",
              filename: "report.pdf",
            },
            {
              type: "file",
              mediaType: "audio/mpeg",
              url: "data:audio/mpeg;base64,YXVkaW8=",
            },
            {
              type: "file",
              mediaType: "video/*",
              url: "https://example.com/demo.mp4",
            },
          ],
        },
      ]);
    });

    it("converts assistant text", () => {
      expect(
        vercelAIMessageFormat.toApi([
          { id: "assistant-1", role: "assistant", content: "The answer is 42." },
        ]),
      ).toEqual([
        {
          id: "assistant-1",
          role: "assistant",
          parts: [{ type: "text", text: "The answer is 42." }],
        },
      ]);
    });

    it("omits an empty text part from a tool-only assistant message", () => {
      expect(
        vercelAIMessageFormat.toApi([
          {
            id: "assistant-tool-only",
            role: "assistant",
            content: "",
            toolCalls: [
              {
                id: "call-1",
                type: "function",
                function: { name: "weather", arguments: '{"city":"Delhi"}' },
              },
            ],
          },
        ]),
      ).toEqual([
        {
          id: "assistant-tool-only",
          role: "assistant",
          parts: [
            {
              type: "dynamic-tool",
              toolName: "weather",
              toolCallId: "call-1",
              state: "input-available",
              input: { city: "Delhi" },
            },
          ],
        },
      ]);
    });

    it("defensively rejects provider-executed metadata on AG-UI-shaped input", () => {
      const messages = [
        {
          id: "assistant-provider-tool",
          role: "assistant",
          toolCalls: [
            {
              id: "call-provider",
              type: "function",
              function: { name: "web_search", arguments: "{}" },
              providerExecuted: true,
            },
          ],
        },
      ] as unknown as Message[];

      expect(() => vercelAIMessageFormat.toApi(messages)).toThrow(
        "Vercel AI SDK provider-executed tools are not supported because AG-UI messages cannot preserve providerExecuted semantics.",
      );
    });

    it("folds separate AG-UI tool results into dynamic tool parts", () => {
      const messages: Message[] = [
        {
          id: "assistant-1",
          role: "assistant",
          content: "Checking the weather.",
          toolCalls: [
            {
              id: "call-1",
              type: "function",
              function: { name: "weather", arguments: '{"city":"Delhi"}' },
            },
            {
              id: "call-2",
              type: "function",
              function: { name: "clock", arguments: "not-json" },
            },
          ],
        },
        {
          id: "result-1",
          role: "tool",
          toolCallId: "call-1",
          content: '{"temperature":31}',
        },
      ];

      expect(vercelAIMessageFormat.toApi(messages)).toEqual([
        {
          id: "assistant-1",
          role: "assistant",
          parts: [
            { type: "text", text: "Checking the weather." },
            {
              type: "dynamic-tool",
              toolName: "weather",
              toolCallId: "call-1",
              state: "output-available",
              input: { city: "Delhi" },
              output: '{"temperature":31}',
            },
            {
              type: "dynamic-tool",
              toolName: "clock",
              toolCallId: "call-2",
              state: "input-available",
              input: "not-json",
            },
          ],
        },
      ]);
    });

    it("maps AG-UI tool errors to output-error parts", () => {
      const messages: Message[] = [
        {
          id: "assistant-1",
          role: "assistant",
          toolCalls: [
            {
              id: "call-1",
              type: "function",
              function: { name: "weather", arguments: "{}" },
            },
          ],
        },
        {
          id: "result-1",
          role: "tool",
          toolCallId: "call-1",
          content: "upstream failed",
          error: "Weather service unavailable",
        },
      ];

      expect(vercelAIMessageFormat.toApi(messages)).toEqual([
        {
          id: "assistant-1",
          role: "assistant",
          parts: [
            {
              type: "dynamic-tool",
              toolName: "weather",
              toolCallId: "call-1",
              state: "output-error",
              input: {},
              errorText: "Weather service unavailable",
            },
          ],
        },
      ]);
    });

    it("maps system and developer messages to the UIMessage system role", () => {
      expect(
        vercelAIMessageFormat.toApi([
          { id: "system-1", role: "system", content: "System instructions" },
          { id: "developer-1", role: "developer", content: "Developer instructions" },
        ]),
      ).toEqual([
        {
          id: "system-1",
          role: "system",
          parts: [{ type: "text", text: "System instructions" }],
        },
        {
          id: "developer-1",
          role: "system",
          parts: [{ type: "text", text: "Developer instructions" }],
        },
      ]);
    });
  });

  describe("fromApi", () => {
    it("converts user text and file parts to AG-UI content", () => {
      expect(
        vercelAIMessageFormat.fromApi([
          {
            id: "user-1",
            role: "user",
            parts: [
              { type: "text", text: "Read this" },
              {
                type: "file",
                mediaType: "image/png",
                filename: "image.png",
                url: "data:image/png;base64,aW1hZ2U=",
              },
              {
                type: "file",
                mediaType: "application/pdf",
                filename: "report.pdf",
                url: "https://example.com/report.pdf",
              },
            ],
          },
        ]),
      ).toEqual([
        {
          id: "user-1",
          role: "user",
          content: [
            { type: "text", text: "Read this" },
            {
              type: "binary",
              mimeType: "image/png",
              filename: "image.png",
              data: "aW1hZ2U=",
            },
            {
              type: "binary",
              mimeType: "application/pdf",
              filename: "report.pdf",
              url: "https://example.com/report.pdf",
            },
          ],
        },
      ]);
    });

    it("converts dynamic and static tool parts, including results and errors", () => {
      const messages = vercelAIMessageFormat.fromApi([
        {
          id: "assistant-1",
          role: "assistant",
          parts: [
            { type: "text", text: "Done" },
            {
              type: "dynamic-tool",
              toolName: "weather",
              toolCallId: "call-1",
              state: "output-available",
              input: { city: "Delhi" },
              output: { temperature: 31 },
            },
            {
              type: "tool-search",
              toolCallId: "call-2",
              state: "output-error",
              input: { query: "OpenUI" },
              errorText: "Search failed",
            },
            {
              type: "tool-email",
              toolCallId: "call-3",
              state: "input-available",
              input: { to: "user@example.com" },
            },
          ],
        },
      ]);

      expect(messages).toEqual([
        {
          id: "assistant-1",
          role: "assistant",
          content: "Done",
          toolCalls: [
            {
              id: "call-1",
              type: "function",
              function: { name: "weather", arguments: '{"city":"Delhi"}' },
            },
            {
              id: "call-2",
              type: "function",
              function: { name: "search", arguments: '{"query":"OpenUI"}' },
            },
            {
              id: "call-3",
              type: "function",
              function: { name: "email", arguments: '{"to":"user@example.com"}' },
            },
          ],
        },
        {
          id: "tool-result-call-1",
          role: "tool",
          toolCallId: "call-1",
          content: '{"temperature":31}',
        },
        {
          id: "tool-result-call-2",
          role: "tool",
          toolCallId: "call-2",
          content: "Search failed",
          error: "Search failed",
        },
      ]);
    });

    it("preserves multi-step assistant, tool-result, assistant ordering", () => {
      expect(
        vercelAIMessageFormat.fromApi([
          {
            id: "assistant-1",
            role: "assistant",
            parts: [
              { type: "step-start" },
              { type: "text", text: "Let me search." },
              {
                type: "dynamic-tool",
                toolName: "search",
                toolCallId: "call-1",
                state: "output-available",
                input: { query: "OpenUI" },
                output: { hits: 1 },
              },
              { type: "step-start" },
              { type: "text", text: "I found the answer." },
            ],
          },
        ]),
      ).toEqual([
        {
          id: "assistant-1",
          role: "assistant",
          content: "Let me search.",
          toolCalls: [
            {
              id: "call-1",
              type: "function",
              function: { name: "search", arguments: '{"query":"OpenUI"}' },
            },
          ],
        },
        {
          id: "tool-result-call-1",
          role: "tool",
          toolCallId: "call-1",
          content: '{"hits":1}',
        },
        {
          id: "assistant-1-segment-2",
          role: "assistant",
          content: "I found the answer.",
        },
      ]);
    });

    it("preserves sequential tool-only step ordering through convertToModelMessages", async () => {
      const restored = vercelAIMessageFormat.fromApi([
        {
          id: "assistant-tool-steps",
          role: "assistant",
          parts: [
            { type: "step-start" },
            {
              type: "dynamic-tool",
              toolName: "lookup",
              toolCallId: "call-1",
              state: "output-available",
              input: { id: "first" },
              output: { nextId: "second" },
            },
            { type: "step-start" },
            {
              type: "dynamic-tool",
              toolName: "lookup",
              toolCallId: "call-2",
              state: "output-available",
              input: { id: "second" },
              output: { value: "done" },
            },
          ],
        },
      ]);

      expect(restored.map((message) => message.role)).toEqual([
        "assistant",
        "tool",
        "assistant",
        "tool",
      ]);

      const uiMessages = vercelAIMessageFormat.toApi(restored) as UIMessage[];
      const modelMessages = await convertToModelMessages(uiMessages);

      expect(modelMessages.map((message) => message.role)).toEqual([
        "assistant",
        "tool",
        "assistant",
        "tool",
      ]);
      expect(modelMessages[0]).toMatchObject({
        role: "assistant",
        content: [{ type: "tool-call", toolCallId: "call-1" }],
      });
      expect(modelMessages[2]).toMatchObject({
        role: "assistant",
        content: [{ type: "tool-call", toolCallId: "call-2" }],
      });
    });

    it.each(["dynamic-tool", "tool-web_search"])(
      "rejects provider-executed %s parts instead of changing their model-message role",
      (type) => {
        const part = {
          type,
          ...(type === "dynamic-tool" ? { toolName: "web_search" } : {}),
          toolCallId: "call-provider",
          state: "output-available",
          input: { query: "OpenUI" },
          output: { results: [] },
          providerExecuted: true,
        };

        expect(() =>
          vercelAIMessageFormat.fromApi([
            { id: "assistant-provider-tool", role: "assistant", parts: [part] },
          ]),
        ).toThrow(
          "Vercel AI SDK provider-executed tools are not supported because AG-UI messages cannot preserve providerExecuted semantics.",
        );
      },
    );

    it("splits consecutive text parts while grouping consecutive tools with their segment", () => {
      expect(
        vercelAIMessageFormat.fromApi([
          {
            id: "assistant-1",
            role: "assistant",
            parts: [
              { type: "text", text: "First section." },
              { type: "text", text: "Second section." },
              {
                type: "tool-weather",
                toolCallId: "call-1",
                state: "output-available",
                input: { city: "Delhi" },
                output: { temperature: 31 },
              },
              {
                type: "dynamic-tool",
                toolName: "clock",
                toolCallId: "call-2",
                state: "output-available",
                input: { timezone: "Asia/Kolkata" },
                output: "12:00",
              },
              { type: "text", text: "Final section." },
            ],
          },
        ]),
      ).toEqual([
        {
          id: "assistant-1",
          role: "assistant",
          content: "First section.",
        },
        {
          id: "assistant-1-segment-2",
          role: "assistant",
          content: "Second section.",
          toolCalls: [
            {
              id: "call-1",
              type: "function",
              function: { name: "weather", arguments: '{"city":"Delhi"}' },
            },
            {
              id: "call-2",
              type: "function",
              function: { name: "clock", arguments: '{"timezone":"Asia/Kolkata"}' },
            },
          ],
        },
        {
          id: "tool-result-call-1",
          role: "tool",
          toolCallId: "call-1",
          content: '{"temperature":31}',
        },
        {
          id: "tool-result-call-2",
          role: "tool",
          toolCallId: "call-2",
          content: "12:00",
        },
        {
          id: "assistant-1-segment-3",
          role: "assistant",
          content: "Final section.",
        },
      ]);
    });

    it("round-trips supported AG-UI messages with documented normalization", () => {
      const messages: Message[] = [
        { id: "system-1", role: "system", content: "Be helpful" },
        {
          id: "user-1",
          role: "user",
          content: [
            { type: "text", text: "Inspect" },
            {
              type: "binary",
              mimeType: "image/png",
              data: "aW1hZ2U=",
              filename: "image.png",
            },
          ],
        },
        {
          id: "assistant-1",
          role: "assistant",
          content: "I inspected it.",
          toolCalls: [
            {
              id: "call-1",
              type: "function",
              function: { name: "inspect", arguments: '{"detailed":true}' },
            },
          ],
        },
        {
          id: "result-1",
          role: "tool",
          toolCallId: "call-1",
          content: '{"safe":true}',
        },
      ];

      expect(vercelAIMessageFormat.fromApi(vercelAIMessageFormat.toApi(messages))).toEqual([
        messages[0],
        messages[1],
        messages[2],
        {
          id: "tool-result-call-1",
          role: "tool",
          toolCallId: "call-1",
          content: '{"safe":true}',
        },
      ]);
    });

    it("returns an empty list for a non-array payload", () => {
      expect(vercelAIMessageFormat.fromApi(null)).toEqual([]);
      expect(vercelAIMessageFormat.fromApi({ messages: [] })).toEqual([]);
    });

    it("skips malformed messages and malformed parts without throwing", () => {
      expect(
        vercelAIMessageFormat.fromApi([
          null,
          "message",
          { id: 123, role: "user", parts: [] },
          { id: "missing-parts", role: "assistant" },
          { id: "unknown-role", role: "tool", parts: [] },
          {
            id: "user-1",
            role: "user",
            parts: [
              null,
              { type: "text", text: 42 },
              { type: "file", mediaType: "image/png" },
              { type: "text", text: "valid" },
            ],
          },
          {
            id: "assistant-1",
            role: "assistant",
            parts: [
              { type: "dynamic-tool", toolName: "", toolCallId: "bad", state: "input-available" },
              { type: "tool-", toolCallId: "bad-2", state: "input-available" },
              { type: "tool-valid", toolCallId: 123, state: "input-available" },
              {
                type: "tool-valid",
                toolCallId: "call-1",
                state: "output-error",
                input: {},
              },
            ],
          },
        ]),
      ).toEqual([
        { id: "user-1", role: "user", content: "valid" },
        {
          id: "assistant-1",
          role: "assistant",
          toolCalls: [
            {
              id: "call-1",
              type: "function",
              function: { name: "valid", arguments: "{}" },
            },
          ],
        },
      ]);
    });
  });
});
