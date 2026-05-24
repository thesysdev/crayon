import type { Meta, StoryObj } from "@storybook/react";
import { Label } from "../Label";

const meta: Meta<typeof Label> = {
  title: "Components/Label",
  component: Label,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "```tsx\nimport { Label } from '@openui-ui/react-ui';\n```",
      },
    },
  },
  argTypes: {
    disabled: {
      control: "boolean",
      description: "Whether the label is disabled",
      table: {
        category: "State",
        type: { summary: "boolean" },
        defaultValue: { summary: "false" },
      },
    },
    required: {
      control: "boolean",
      description: "Shows a required asterisk indicator",
      table: {
        category: "Behavior",
        type: { summary: "boolean" },
        defaultValue: { summary: "false" },
      },
    },
    children: {
      control: "text",
      description: "Label content",
      table: {
        category: "Content",
        type: { summary: "ReactNode" },
      },
    },
    htmlFor: {
      control: "text",
      description: "The id of the element the label is associated with",
      table: {
        category: "Behavior",
        type: { summary: "string" },
      },
    },
  },
  tags: ["autodocs", "!dev"],
};

export default meta;
type Story = StoryObj<typeof Label>;

export const Default: Story = {
  args: {
    children: "Email address",
  },
};

export const Required: Story = {
  args: {
    children: "Full name",
    required: true,
  },
};

export const Disabled: Story = {
  args: {
    children: "Username",
    disabled: true,
  },
};

export const AssociatedWithInput: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <Label htmlFor="email-field">Email address</Label>
      <input
        id="email-field"
        type="email"
        placeholder="you@example.com"
        style={{
          padding: "8px 12px",
          border: "1px solid var(--openui-border-interactive)",
          borderRadius: "6px",
          fontSize: "14px",
        }}
      />
    </div>
  ),
};
