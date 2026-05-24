import type { Meta, StoryObj } from "@storybook/react";
import { Bold, Italic, Underline } from "lucide-react";
import { ToggleGroup } from "../../ToggleGroup";
import { ToggleItem } from "../ToggleItem";

const meta: Meta<typeof ToggleItem> = {
  title: "Components/ToggleItem",
  component: ToggleItem,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "```tsx\nimport { ToggleItem } from '@openui-ui/react-ui';\n```",
      },
    },
  },
  argTypes: {
    value: {
      control: "text",
      description: "The value of the toggle item",
      table: {
        category: "Behavior",
        type: { summary: "string" },
      },
    },
    disabled: {
      control: "boolean",
      description: "Whether the toggle item is disabled",
      table: {
        category: "State",
        type: { summary: "boolean" },
        defaultValue: { summary: "false" },
      },
    },
    children: {
      control: "text",
      description: "The content of the toggle item",
      table: {
        category: "Content",
        type: { summary: "ReactNode" },
      },
    },
  },
  tags: ["!dev", "!autodocs"],
};

export default meta;
type Story = StoryObj<typeof ToggleItem>;

export const InGroup: Story = {
  render: () => (
    <ToggleGroup type="single" aria-label="Text alignment">
      <ToggleItem value="bold">
        <Bold size={14} />
      </ToggleItem>
      <ToggleItem value="italic">
        <Italic size={14} />
      </ToggleItem>
      <ToggleItem value="underline">
        <Underline size={14} />
      </ToggleItem>
    </ToggleGroup>
  ),
};

export const Disabled: Story = {
  render: () => (
    <ToggleGroup type="single" aria-label="Text formatting" defaultValue="bold">
      <ToggleItem value="bold">
        <Bold size={14} />
      </ToggleItem>
      <ToggleItem value="italic" disabled>
        <Italic size={14} />
      </ToggleItem>
      <ToggleItem value="underline">
        <Underline size={14} />
      </ToggleItem>
    </ToggleGroup>
  ),
};

export const TextLabels: Story = {
  render: () => (
    <ToggleGroup type="multiple" aria-label="Font styles" defaultValue={["bold", "italic"]}>
      <ToggleItem value="bold">Bold</ToggleItem>
      <ToggleItem value="italic">Italic</ToggleItem>
      <ToggleItem value="underline">Underline</ToggleItem>
    </ToggleGroup>
  ),
};

export const SingleSelection: Story = {
  render: () => (
    <ToggleGroup type="single" aria-label="Menu view" defaultValue="list">
      <ToggleItem value="list">List</ToggleItem>
      <ToggleItem value="grid">Grid</ToggleItem>
      <ToggleItem value="compact">Compact</ToggleItem>
    </ToggleGroup>
  ),
};
