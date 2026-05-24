import type { Meta, StoryObj } from "@storybook/react";
import { ToolCallComponent } from "../ToolCall";
import { BehindTheScenes } from "../BehindTheScenes";

const meta: Meta<typeof ToolCallComponent> = {
  title: "Components/ToolCall",
  component: ToolCallComponent,
  subcomponents: { BehindTheScenes: BehindTheScenes as any },
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: "```tsx\nimport { ToolCallComponent, BehindTheScenes } from '@openui-ui/react-ui';\n```",
      },
    },
  },
  argTypes: {
    toolCall: {
      control: "object",
      description: "The tool call object",
      table: {
        category: "Content",
        type: { summary: "ToolCall" },
      },
    },
    isStreaming: {
      control: "boolean",
      description: "Whether the message is currently streaming",
      table: {
        category: "State",
        type: { summary: "boolean" },
      },
    },
    toolsDone: {
      control: "boolean",
      description: "True once tool work is done",
      table: {
        category: "State",
        type: { summary: "boolean" },
      },
    },
    isLast: {
      control: "boolean",
      description: "Whether this is the last tool call in the sequence",
      table: {
        category: "State",
        type: { summary: "boolean" },
      },
    },
  },
  tags: ["!dev", "autodocs"],
};

export default meta;
type Story = StoryObj<typeof ToolCallComponent>;

const defaultToolCall = {
  id: "call_123",
  type: "function" as const,
  function: {
    name: "get_weather",
    arguments: JSON.stringify({ location: "San Francisco", unit: "celsius" }),
  },
};

export const Default: Story = {
  args: {
    toolCall: defaultToolCall,
  },
};

export const Streaming: Story = {
  args: {
    toolCall: defaultToolCall,
    isStreaming: true,
    isLast: true,
  },
};

export const Completed: Story = {
  args: {
    toolCall: {
      id: "call_456",
      type: "function" as const,
      function: {
        name: "search_documents",
        arguments: JSON.stringify({
          _request: { query: "annual report 2025", maxResults: 5 },
          _response: { totalResults: 42, results: ["doc1", "doc2"] },
        }),
      },
    },
    toolsDone: true,
    isLast: true,
  },
};

export const WithErrorResponse: Story = {
  args: {
    toolCall: {
      id: "call_789",
      type: "function" as const,
      function: {
        name: "send_email",
        arguments: JSON.stringify({
          _request: { to: "user@example.com", subject: "Hello" },
          _response: { error: "recipient not found", status: 404 },
        }),
      },
    },
    toolsDone: true,
    isLast: true,
  },
};

export const BehindTheScenesExample: Story = {
  name: "BehindTheScenes",
  render: () => (
    <div style={{ width: "500px" }}>
      <BehindTheScenes>
        <ToolCallComponent toolCall={defaultToolCall} toolsDone />
        <ToolCallComponent
          toolCall={{
            id: "call_002",
            type: "function" as const,
            function: {
              name: "get_stock_price",
              arguments: JSON.stringify({ symbol: "AAPL" }),
            },
          }}
          toolsDone
        />
      </BehindTheScenes>
    </div>
  ),
};
