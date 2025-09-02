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
      <RadioItem value="option1" label="Option 1" description="Option 1 description" />
      <RadioItem value="option2" label="Option 2" description="Option 2 description" />
      <RadioItem value="option3" label="Option 3" description="Option 3 description" />
    </RadioGroup>
  ),
};

export const WithLongDescription: Story = {
  args: {
    variant: "card",
  },
  render: (args) => (
    <RadioGroup {...args}>
      <RadioItem
        value="long1"
        label="First option with a long description"
        description="This is a long description that elaborates on the choice in great detail so that readers can fully understand the implications of selecting this option. It provides context, examples, and any caveats that might be relevant when making a selection."
      />
      <RadioItem
        value="long2"
        label="Second option with a long description"
        description="Another extended description that spans multiple sentences to showcase how the component behaves with verbose content. It should wrap correctly and remain readable without breaking the layout of the radio group."
      />
      <RadioItem
        value="long3"
        label="Third option with a long description"
        description="A very long explanation that includes more nuance about the option, possible trade-offs, and guidance for when this might be preferred. This helps validate the design for accessibility and usability with real-world copy lengths."
      />
    </RadioGroup>
  ),
};
