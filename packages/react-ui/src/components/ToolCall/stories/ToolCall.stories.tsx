import type { ToolCall } from "@openuidev/react-headless";
import type { Meta, StoryObj } from "@storybook/react";
import { ToolCallComponent } from "../ToolCall";

type Story = StoryObj<typeof ToolCallComponent>;

const plainToolCall: ToolCall = {
  id: "tool-call-1",
  type: "function",
  function: {
    name: "search",
    arguments: JSON.stringify(
      {
        query: "OpenUI Storybook components",
        limit: 5,
      },
      null,
      2,
    ),
  },
};

const requestResponseToolCall: ToolCall = {
  id: "tool-call-2",
  type: "function",
  function: {
    name: "get_weather",
    arguments: JSON.stringify(
      {
        _request: {
          location: "Florianópolis, SC",
          unit: "celsius",
        },
        _response: {
          temperature: 24,
          condition: "Partly cloudy",
        },
      },
      null,
      2,
    ),
  },
};

const streamingToolCall: ToolCall = {
  id: "tool-call-3",
  type: "function",
  function: {
    name: "generate_report",
    arguments: JSON.stringify(
      {
        _request: {
          topic: "Weekly usage summary",
          format: "markdown",
        },
      },
      null,
      2,
    ),
  },
};

export const Default: Story = {
  args: {
    toolCall: plainToolCall,
    isStreaming: false,
    toolsDone: true,
    isLast: false,
  },
  parameters: {
    docs: {
      description: {
        story: "A basic tool call with plain function arguments.",
      },
    },
  },
};

export const WithRequestAndResponse: Story = {
  args: {
    toolCall: requestResponseToolCall,
    isStreaming: false,
    toolsDone: true,
    isLast: false,
  },
  parameters: {
    docs: {
      description: {
        story: "A completed tool call displaying request and response payloads.",
      },
    },
  },
};

export const Streaming: Story = {
  args: {
    toolCall: streamingToolCall,
    isStreaming: true,
    toolsDone: false,
    isLast: true,
  },
  parameters: {
    docs: {
      description: {
        story: "A running tool call while the tool response is still streaming.",
      },
    },
  },
};

const meta: Meta<typeof ToolCallComponent> = {
  title: "Components/ToolCall",
  component: ToolCallComponent,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "```tsx\nimport { ToolCallComponent } from '@openuidev/react-ui';\n```",
      },
    },
    controls: {
      exclude: ["className"],
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: "520px" }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    toolCall: {
      control: "object",
      table: {
        category: "Data",
      },
    },
    isStreaming: {
      control: "boolean",
      table: {
        category: "State",
      },
    },
    toolsDone: {
      control: "boolean",
      table: {
        category: "State",
      },
    },
    isLast: {
      control: "boolean",
      table: {
        category: "State",
      },
    },
    className: {
      table: {
        disable: true,
      },
    },
  },
  tags: ["autodocs", "!dev"],
};

export default meta;
