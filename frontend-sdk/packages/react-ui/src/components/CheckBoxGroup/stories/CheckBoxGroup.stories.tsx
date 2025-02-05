import type { Meta, StoryObj } from "@storybook/react";
import { CheckBoxItem } from "../../CheckBoxItem";
import "../../CheckBoxItem/checkBoxItem.scss";
import "../../Label/label.scss";
import { CheckBoxGroup } from "../CheckBoxGroup";
import "../checkBoxGroup.scss";

const meta = {
  title: "Components/CheckBoxGroup",
  component: CheckBoxGroup,
  subcomponents: { CheckBoxItem } as any,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "```tsx\nimport { CheckBoxGroup, CheckBoxItem } from '@crayon-ui/react-ui';\n```",
      },
    },
  },
  argTypes: {
    variant: {
      control: "radio",
      options: ["clear", "card", "sunk"],
      description: "The visual style variant of the checkbox group",
      table: {
        category: "Appearance",
        type: {
          summary: "'clear' | 'card' | 'sunk'",
        },
        defaultValue: { summary: "clear" },
      },
    },
    children: {
      control: false,
      description: "The child elements of the checkbox group that accept CheckBoxItem components",
      table: {
        category: "Content",
        type: {
          summary: "ReactNode[] | ReactNode",
        },
        expanded: false,
      },
    },
    className: {
      control: false,
      description: "Additional CSS class name for custom styling",
      table: {
        category: "Styling",
        type: {
          summary: "string",
        },
        expanded: false,
      },
    },
    style: {
      control: false,
      description: "Inline CSS styles for custom styling",
      table: {
        category: "Styling",
        type: {
          summary: "CSSProperties",
        },
        expanded: false,
      },
    },
  },
  tags: ["!dev", "autodocs"],
} satisfies Meta<typeof CheckBoxGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ClearVariant: Story = {
  args: {
    variant: "clear",
    children: [
      <CheckBoxItem key="1" label="Option 1" />,
      <CheckBoxItem key="2" label="Option 2" />,
      <CheckBoxItem key="3" label="Option 3" />,
    ],
  },
};

export const CardVariant: Story = {
  args: {
    variant: "card",
    children: [
      <CheckBoxItem key="1" label="Card Option 1" />,
      <CheckBoxItem key="2" label="Card Option 2" />,
      <CheckBoxItem key="3" label="Card Option 3" />,
    ],
  },
};

export const SunkVariant: Story = {
  args: {
    variant: "sunk",
    children: [
      <CheckBoxItem key="1" label="Sunk Option 1" />,
      <CheckBoxItem key="2" label="Sunk Option 2" />,
      <CheckBoxItem key="3" label="Sunk Option 3" />,
    ],
  },
};
