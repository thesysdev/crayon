import type { Meta, StoryObj } from "@storybook/react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "../Select";
import "../select.scss";

interface SelectStoryProps {
  size?: "sm" | "md" | "lg";
  showTick?: boolean;
  hideDropdownIcon?: boolean;
  placeholder?: string;
}

const meta: Meta<SelectStoryProps> = {
  title: "Components/Select",
  component: Select as any,
  tags: ["!dev", "autodocs"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "```tsx\nimport { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from '@crayon-ui/react-ui';\n```",
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: "240px" }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    size: {
      control: "radio",
      options: ["sm", "md", "lg"],
      description: "The size of the select trigger",
      table: {
        type: { summary: "string" },
        defaultValue: { summary: "md" },
      },
    },
    showTick: {
      control: "boolean",
      description: "Whether to show the tick icon for selected items",
      table: {
        type: { summary: "boolean" },
        defaultValue: { summary: "true" },
      },
    },
    hideDropdownIcon: {
      control: "boolean",
      description: "Whether to hide the dropdown icon in the trigger",
      table: {
        type: { summary: "boolean" },
        defaultValue: { summary: "false" },
      },
    },
    placeholder: {
      control: "text",
      description: "Placeholder text for the select",
      table: {
        type: { summary: "string" },
      },
    },
  },
};

export default meta;
type Story = StoryObj<SelectStoryProps>;

export const Basic: Story = {
  args: {
    size: "md",
    showTick: true,
    hideDropdownIcon: false,
    placeholder: "Select an option",
  },
  render: (args) => (
    <Select>
      <SelectTrigger
        style={{ width: "228px" }}
        hideDropdownIcon={args.hideDropdownIcon}
        size={args.size}
      >
        <SelectValue placeholder={args.placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Fruits</SelectLabel>
          {/* Use SelectLabel to label the group of options  */}
          <SelectItem value="apple">Apple</SelectItem>
          <SelectItem value="banana">Banana</SelectItem>
          <SelectItem value="blueberry">Blueberry</SelectItem>
          <SelectItem value="grapes">Grapes</SelectItem>
          <SelectItem value="pineapple">Pineapple</SelectItem>
          <SelectSeparator />
          <SelectLabel>Fast Food</SelectLabel>
          {/* Use SelectLabel to label the group of options  */}
          <SelectItem value="burger">Burger</SelectItem>
          <SelectItem value="pizza">Pizza</SelectItem>
          <SelectItem value="pasta">Pasta</SelectItem>
          <SelectItem value="salad">Salad</SelectItem>
          <SelectItem value="ice-cream">Ice Cream</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  ),
};
