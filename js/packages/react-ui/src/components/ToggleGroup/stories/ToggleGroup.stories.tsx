import type { Meta, StoryObj } from "@storybook/react";
import { MoveHorizontal, MoveLeft, MoveRight } from "lucide-react";
import { ToggleItem } from "../../ToggleItem";
import { ToggleGroup } from "../ToggleGroup";

const meta: Meta<typeof ToggleGroup> = {
  title: "Components/ToggleGroup",
  component: ToggleGroup,
  subcomponents: {
    ToggleItem: ToggleItem as any,
  },
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "```tsx\nimport { ToggleGroup, ToggleItem } from '@crayon-ui/react-ui';\n```",
      },
    },
  },
  argTypes: {
    type: {
      control: "radio",
      options: ["single", "multiple"],
      description: "The type of toggle group",
      table: {
        category: "Appearance",
        type: { summary: "string" },
        defaultValue: { summary: "single" },
      },
    },
    children: {
      control: false,
      description: "The children of the toggle group",
      table: {
        category: "Content",
        type: { summary: "ToggleItemProps[]| ToggleItemProps" },
      },
    },
    className: {
      control: false,
      description: "Additional CSS class name for custom styling",
      table: {
        category: "Styling",
      },
    },
    style: {
      control: false,
      description: "Additional CSS style for custom styling",
      table: {
        category: "Styling",
      },
    },
  },
  tags: ["autodocs", "!dev"],
};

export default meta;
type Story = StoryObj<typeof ToggleGroup>;

export const SingleSelection: Story = {
  args: {
    type: "single",
  },
  render: (args) => (
    <ToggleGroup {...args} aria-label="Text alignment">
      <ToggleItem value="left">Left</ToggleItem>
      <ToggleItem value="center">Center</ToggleItem>
      <ToggleItem value="right">Right</ToggleItem>
    </ToggleGroup>
  ),
};

export const MultipleSelection: Story = {
  args: {
    type: "multiple",
    defaultValue: ["bold", "italic"],
  },
  render: (args) => (
    <ToggleGroup {...args} aria-label="Text formatting">
      <ToggleItem value="bold">Bold</ToggleItem>
      <ToggleItem value="italic">Italic</ToggleItem>
      <ToggleItem value="underline">Underline</ToggleItem>
    </ToggleGroup>
  ),
};

export const Disabled: Story = {
  args: {
    type: "single",
    defaultValue: "left",
  },
  render: (args) => (
    <ToggleGroup {...args} aria-label="Text alignment">
      <ToggleItem value="left">Left</ToggleItem>
      <ToggleItem value="center" disabled>
        Center
      </ToggleItem>
      <ToggleItem value="right">Right</ToggleItem>
    </ToggleGroup>
  ),
};

export const WithIcons: Story = {
  args: {
    type: "single",
    defaultValue: "left",
  },
  render: (args) => (
    <ToggleGroup {...args} aria-label="Text alignment">
      <ToggleItem value="left">
        <MoveLeft size={14} />
      </ToggleItem>
      <ToggleItem value="center">
        <MoveHorizontal size={14} />
      </ToggleItem>
      <ToggleItem value="right">
        <MoveRight size={14} />
      </ToggleItem>
    </ToggleGroup>
  ),
};
