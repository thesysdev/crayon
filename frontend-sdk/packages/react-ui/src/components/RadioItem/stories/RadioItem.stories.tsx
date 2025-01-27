import * as Radio from "@radix-ui/react-radio-group";
import type { Meta, StoryObj } from "@storybook/react";
import "../../FormControl/Label/label.scss";
import { RadioItem } from "../RadioItem";
import "../radioItem.scss";

const meta: Meta<typeof RadioItem> = {
  title: "Components/RadioItem",
  component: RadioItem,
  parameters: {
    layout: "centered",
  },
  decorators: [
    (Story) => (
      <Radio.Root defaultValue="default">
        <Story />
      </Radio.Root>
    ),
  ],
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof RadioItem>;

export const Default: Story = {
  args: {
    value: "default",
  },
};

export const WithLabel: Story = {
  args: {
    value: "with-label",
    label: "Radio Option",
  },
};

export const Disabled: Story = {
  args: {
    value: "disabled",
    label: "Disabled Option",
    disabled: true,
  },
};

export const Required: Story = {
  args: {
    value: "required",
    label: "Required Option",
    required: true,
  },
};

export const MultipleOptions: Story = {
  render: () => (
    <Radio.Root defaultValue="option1">
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <RadioItem value="option1" label="Option 1" />
        <RadioItem value="option2" label="Option 2" />
        <RadioItem value="option3" label="Option 3" />
      </div>
    </Radio.Root>
  ),
};

export const CustomStyling: Story = {
  args: {
    value: "custom",
    label: "Custom Styled Option",
    className: "custom-radio",
    style: { marginLeft: "16px" },
  },
};
