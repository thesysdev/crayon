import type { Meta, StoryObj } from "@storybook/react";
import "../../FormControl/Label/label.scss";
import { CheckBoxItem } from "../CheckBoxItem";
import "../checkBoxItem.scss";

const meta: Meta<typeof CheckBoxItem> = {
  title: "Components/CheckBoxItem",
  component: CheckBoxItem,
  parameters: {
    layout: "centered",
  },
  argTypes: {
    label: {
      control: "text",
      defaultValue: "Default Checkbox",
      description: "The label of the checkbox",
      table: {
        type: {
          summary: "string",
        },
      },
    },
    checked: {
      control: "boolean",
      description: "State of the checkbox, used for controlled mode",
      table: {
        type: {
          summary: "boolean",
        },
        defaultValue: { summary: "false" },
      },
    },
    defaultChecked: {
      control: false,
      description:
        "The checked state of the checkbox when it is initially rendered. Use when you do not need to control its checked state.",
      table: {
        type: {
          summary: "boolean",
        },
        defaultValue: { summary: "false" },
      },
    },
    disabled: {
      control: "boolean",
      description: "Whether the checkbox is disabled or not",
      table: {
        type: { summary: "boolean" },
        defaultValue: { summary: "false" },
      },
    },
    required: {
      control: "boolean",
      description:
        "When true, indicates that the user must check the checkbox before the owning form can be submitted.",
      table: {
        type: { summary: "boolean" },
        defaultValue: { summary: "false" },
      },
    },
    name: {
      control: false,
      description:
        "The name of the checkbox. Submitted with its owning form as part of a name/value pair.",
      table: {
        type: { summary: "string" },
        defaultValue: { summary: "undefined" },
      },
    },
    value: {
      control: false,
      description: "The value given as data when submitted with a `name`/`value` pair.",
      table: {
        type: { summary: "string" },
      },
    },
    onChange: {
      control: false,
      description: "The function to call when the checkbox is changed",
      table: {
        type: {
          summary: "(checked: boolean) => void",
        },
      },
    },
    className: {
      control: false,
      description: "The class name of the checkbox",
      table: {
        category: "Appearance",
        type: {
          summary: "string",
        },
      },
    },
    style: {
      control: false,
      description: "The style of the checkbox",
      table: {
        category: "Appearance",
        type: {
          summary: "CSSProperties",
        },
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof CheckBoxItem>;

export const Default: Story = {
  args: {
    label: "Default Checkbox",
    onChange: (checked) => console.log("Checkbox changed:", checked),
  },
};

export const Checked: Story = {
  args: {
    label: "Checked Checkbox",
    checked: true,
    onChange: (checked) => console.log("Checkbox changed:", checked),
  },
};

export const Disabled: Story = {
  args: {
    label: "Disabled Checkbox",
    disabled: true,
    onChange: (checked) => console.log("Checkbox changed:", checked),
  },
};

export const DisabledChecked: Story = {
  args: {
    label: "Disabled Checked Checkbox",
    disabled: true,
    checked: true,
    onChange: (checked) => console.log("Checkbox changed:", checked),
  },
};
