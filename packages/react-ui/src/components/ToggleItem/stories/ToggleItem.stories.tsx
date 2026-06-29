import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";
import type { Meta, StoryObj } from "@storybook/react";
import { ToggleItem } from "../ToggleItem";

type Story = StoryObj<typeof ToggleItem>;

export const Default: Story = {
  args: {
    children: "Just a toggle",
    value: "toggle",
    disabled: false,
  },
  render: (args) => (
    <ToggleGroupPrimitive.Root type="single" defaultValue={args.value}>
      <ToggleItem value={args.value} disabled={args.disabled}>
        {args.children}
      </ToggleItem>
    </ToggleGroupPrimitive.Root>
  ),
  parameters: {
    docs: {
      description: {
        story: "A basic toggle item rendered inside a single-select toggle group.",
      },
    },
  },
};

export const Disabled: Story = {
  args: {
    children: "Disabled toggle",
    value: "disabled",
    disabled: true,
  },
  render: (args) => (
    <ToggleGroupPrimitive.Root type="single">
      <ToggleItem value={args.value} disabled={args.disabled}>
        {args.children}
      </ToggleItem>
    </ToggleGroupPrimitive.Root>
  ),
  parameters: {
    docs: {
      description: {
        story: "A disabled toggle item.",
      },
    },
  },
};

export const Multiple: Story = {
  render: () => (
    <ToggleGroupPrimitive.Root type="multiple" defaultValue={["bold", "italic"]}>
      <ToggleItem value="bold">Bold</ToggleItem>
      <ToggleItem value="italic">Italic</ToggleItem>
      <ToggleItem value="underline">Underline</ToggleItem>
    </ToggleGroupPrimitive.Root>
  ),
  parameters: {
    docs: {
      description: {
        story: "Multiple toggle items rendered inside a multi-select toggle group.",
      },
    },
  },
};

const meta: Meta<typeof ToggleItem> = {
  title: "Components/ToggleItem",
  component: ToggleItem,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "```tsx\nimport { ToggleItem } from '@openuidev/react-ui';\n```",
      },
    },
    controls: {
      exclude: ["className"],
    },
  },
  argTypes: {
    children: {
      control: "text",
    },
    value: {
      control: "text",
      description: "Unique value that identifies this item inside the toggle group.",
    },
    disabled: {
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
