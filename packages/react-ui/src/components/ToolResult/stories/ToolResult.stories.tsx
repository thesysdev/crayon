import type { ToolMessage } from "@openuidev/react-headless";
import type { Meta, StoryObj } from "@storybook/react";
import { ToolResult } from "../ToolResult";

type Story = StoryObj<typeof ToolResult>;

const successMessage = {
  content: JSON.stringify(
    {
      temperature: 24,
      condition: "Partly cloudy",
      location: "Florianópolis, SC",
    },
    null,
    2,
  ),
} as ToolMessage;

const errorMessage = {
  content: JSON.stringify(
    {
      message: "Unable to fetch weather data.",
    },
    null,
    2,
  ),
  error: "The weather service returned an unavailable response.",
} as ToolMessage;

const plainMessage = {
  content: "Tool completed successfully.",
} as ToolMessage;

export const Default: Story = {
  args: {
    message: successMessage,
    toolName: "get_weather",
  },
  parameters: {
    docs: {
      description: {
        story: "A successful tool result with formatted output.",
      },
    },
  },
};

export const Error: Story = {
  args: {
    message: errorMessage,
    toolName: "get_weather",
  },
  parameters: {
    docs: {
      description: {
        story: "A tool result with an error message.",
      },
    },
  },
};

export const WithoutToolName: Story = {
  args: {
    message: plainMessage,
  },
  parameters: {
    docs: {
      description: {
        story: "A tool result without a resolved tool name.",
      },
    },
  },
};

const meta: Meta<typeof ToolResult> = {
  title: "Components/ToolResult",
  component: ToolResult,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "```tsx\nimport { ToolResult } from '@openuidev/react-ui';\n```",
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
    message: {
      control: "object",
      table: {
        category: "Data",
      },
    },
    toolName: {
      control: "text",
      table: {
        category: "Data",
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
