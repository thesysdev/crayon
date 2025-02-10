import type { Meta, StoryObj } from "@storybook/react";
import { RadioItem } from "../../RadioItem";
import { RadioGroup } from "../RadioGroup";

const meta: Meta<typeof RadioGroup> = {
  title: "Components/RadioGroup",
  component: RadioGroup,
  subcomponents: {
    RadioItem: RadioItem as any,
  },
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "```tsx\nimport { RadioGroup, RadioItem } from '@crayon-ui/react-ui';\n```",
      },
    },
  },
  argTypes: {
    variant: {
      control: "radio",
      options: ["clear", "card", "sunk"],
      description: "The variant of the radio group",
      table: {
        category: "Appearance",
        type: { summary: "string" },
        defaultValue: { summary: "clear" },
      },
    },
    children: {
      control: false,
      description: "The children of the radio group",
      table: {
        category: "Content",
        type: { summary: "RadioItemProps[]| RadioItemProps" },
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
  tags: ["!dev", "autodocs"],
};

export default meta;
type Story = StoryObj<typeof RadioGroup>;

export const Default: Story = {
  args: {
    variant: "card",
  },
  render: (args) => (
    <RadioGroup {...args}>
      <RadioItem value="option1" label="Option 1" />
      <RadioItem value="option2" label="Option 2" />
      <RadioItem value="option3" label="Option 3" />
    </RadioGroup>
  ),
};
