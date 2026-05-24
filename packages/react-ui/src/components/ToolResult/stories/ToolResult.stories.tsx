import type { Meta, StoryObj } from "@storybook/react";
import { ToolResult } from "../ToolResult";

const meta: Meta<typeof ToolResult> = {
  title: "Components/ToolResult",
  component: ToolResult,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: "```tsx\nimport { ToolResult } from '@openui-ui/react-ui';\n```",
      },
    },
  },
  argTypes: {
    message: {
      control: "object",
      description: "The tool result message",
      table: {
        category: "Content",
        type: { summary: "ToolMessage" },
      },
    },
    toolName: {
      control: "text",
      description: "The name of the tool that was called",
      table: {
        category: "Content",
        type: { summary: "string" },
      },
    },
  },
  tags: ["!dev", "autodocs"],
};

export default meta;
type Story = StoryObj<typeof ToolResult>;

export const Default: Story = {
  args: {
    message: {
      id: "msg_001",
      role: "tool" as const,
      toolCallId: "call_123",
      content: JSON.stringify({ temperature: 22, conditions: "Sunny", humidity: "45%" }),
    },
    toolName: "get_weather",
  },
};

export const Error: Story = {
  args: {
    message: {
      id: "msg_002",
      role: "tool" as const,
      toolCallId: "call_456",
      content: "",
      error: "Failed to fetch data from the remote server (timeout after 30s).",
    },
    toolName: "search_documents",
  },
};

export const PlainTextResult: Story = {
  args: {
    message: {
      id: "msg_003",
      role: "tool" as const,
      toolCallId: "call_789",
      content: "Calculation complete. Result: 42.",
    },
    toolName: "calculate",
  },
};

export const LargeResult: Story = {
  args: {
    message: {
      id: "msg_004",
      role: "tool" as const,
      toolCallId: "call_012",
      content: JSON.stringify(
        Array.from({ length: 20 }, (_, i) => ({
          id: i + 1,
          name: `Item ${i + 1}`,
          value: Math.random().toString(36).substring(2, 8),
        })),
        null,
        2,
      ),
    },
    toolName: "list_items",
  },
};
