import { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Input } from "../Input";
import "../input.scss";

const meta: Meta<typeof Input> = {
  title: "Components/Input",
  component: Input,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "```tsx\nimport { Input } from '@crayon-ui/react-ui';\n```",
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: "400px" }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    size: {
      control: "radio",
      options: ["small", "medium", "large"],
      description: "The size of the input",
      table: {
        category: "Appearance",
        type: { summary: "string" },
        defaultValue: { summary: "medium" },
      },
    },
    disabled: {
      control: "boolean",
      description: "Whether the input is disabled",
      table: {
        category: "Behavior",
        type: { summary: "boolean" },
        defaultValue: { summary: "false" },
      },
    },
    placeholder: {
      control: "text",
      description: "The placeholder text for the input",
      table: {
        category: "Content",
        type: { summary: "string" },
      },
    },
    value: {
      control: "text",
      description: "The value of the input",
      table: {
        category: "Content",
        type: { summary: "string" },
      },
    },
    onChange: {
      control: false,
      description: "The function to call when the input value changes",
      table: {
        category: "Behavior",
        type: { summary: "function" },
      },
    },
    styles: {
      control: false,
      description: "Additional CSS styles to apply to the input",
      table: {
        category: "Styling",
      },
    },
    className: {
      control: false,
      description: "Additional CSS classes to apply to the input",
      table: {
        category: "Styling",
      },
    },
  },
  tags: ["!dev", "autodocs"],
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {
  args: {
    size: "medium",
    placeholder: "Enter text...",
    disabled: false,
  },
  render: (args) => (
    <Input
      size={args.size}
      placeholder={args.placeholder}
      disabled={args.disabled}
      value={args.value}
      onChange={args.onChange}
    />
  ),
};

const ControlledInput = () => {
  const [value, setValue] = useState<string | undefined>();

  return (
    <Input
      size="medium"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder="Enter text..."
    />
  );
};

export const Controlled: Story = {
  render: () => <ControlledInput />,
  parameters: {
    docs: {
      description: {
        story:
          "This is a controlled input example. The input value is managed by the component's state.",
      },
      source: {
        code: `
import { useState } from "react";

const ControlledInput = () => {
  const [value, setValue] = useState<string | undefined>();

  return <Input size="medium" value={value} onChange={(e) => setValue(e.target.value)} placeholder="Enter text..." />;
};`,
      },
    },
  },
};
