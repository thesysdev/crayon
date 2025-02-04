import type { Meta, StoryObj } from "@storybook/react";
import "../../Label/label.scss";
import { RadioItem } from "../../RadioItem";
import "../../RadioItem/radioItem.scss";
import { RadioGroup } from "../RadioGroup";
import "../radioGroup.scss";

const meta: Meta<typeof RadioGroup> = {
  title: "Components/RadioGroup",
  component: RadioGroup,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof RadioGroup>;

export const Default: Story = {
  args: {
    defaultValue: "option1",
    children: (
      <>
        <RadioItem value="option1" label="Option 1" />
        <RadioItem value="option2" label="Option 2" />
        <RadioItem value="option3" label="Option 3" />
      </>
    ),
  },
};

export const CardVariant: Story = {
  args: {
    variant: "card",
    defaultValue: "option1",
    children: (
      <>
        <RadioItem value="option1" label="Option 1" />
        <RadioItem value="option2" label="Option 2" />
        <RadioItem value="option3" label="Option 3" />
      </>
    ),
  },
};

export const SunkVariant: Story = {
  args: {
    variant: "sunk",
    defaultValue: "option1",
    children: (
      <>
        <RadioItem value="option1" label="Option 1" />
        <RadioItem value="option2" label="Option 2" />
        <RadioItem value="option3" label="Option 3" />
      </>
    ),
  },
};

export const WithDisabledOption: Story = {
  args: {
    defaultValue: "option1",
    children: (
      <>
        <RadioItem value="option1" label="Option 1" />
        <RadioItem value="option2" label="Option 2" disabled />
        <RadioItem value="option3" label="Option 3" />
      </>
    ),
  },
};

export const WithDescription: Story = {
  args: {
    defaultValue: "option1",
    children: (
      <>
        <RadioItem value="option1" label="Option 1" />
        <RadioItem value="option2" label="Option 2" />
        <RadioItem value="option3" label="Option 3" />
      </>
    ),
  },
};
