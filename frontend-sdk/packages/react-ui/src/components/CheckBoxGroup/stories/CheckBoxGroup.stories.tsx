import type { Meta, StoryObj } from "@storybook/react";
import { CheckBoxItem } from "../../CheckBoxItem";
import "../../CheckBoxItem/checkBoxItem.scss";
import "../../FormControl/Label/label.scss";
import { CheckBoxGroup } from "../CheckBoxGroup";
import "../checkBoxGroup.scss";

const meta = {
  title: "Components/CheckBoxGroup",
  component: CheckBoxGroup,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof CheckBoxGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: [
      <CheckBoxItem key="1" label="Option 1" onChange={() => {}} />,
      <CheckBoxItem key="2" label="Option 2" onChange={() => {}} />,
      <CheckBoxItem key="3" label="Option 3" onChange={() => {}} />,
    ],
  },
};

export const ClearVariant: Story = {
  args: {
    variant: "clear",
    children: [
      <CheckBoxItem key="1" label="Clear Option 1" onChange={() => {}} />,
      <CheckBoxItem key="2" label="Clear Option 2" onChange={() => {}} />,
      <CheckBoxItem key="3" label="Clear Option 3" onChange={() => {}} />,
    ],
  },
};

export const CardVariant: Story = {
  args: {
    variant: "card",
    children: [
      <CheckBoxItem key="1" label="Card Option 1" onChange={() => {}} />,
      <CheckBoxItem key="2" label="Card Option 2" onChange={() => {}} />,
      <CheckBoxItem key="3" label="Card Option 3" onChange={() => {}} />,
    ],
  },
};

export const SunkVariant: Story = {
  args: {
    variant: "sunk",
    children: [
      <CheckBoxItem key="1" label="Sunk Option 1" onChange={() => {}} />,
      <CheckBoxItem key="2" label="Sunk Option 2" onChange={() => {}} />,
      <CheckBoxItem key="3" label="Sunk Option 3" onChange={() => {}} />,
    ],
  },
};

export const WithCustomClassName: Story = {
  args: {
    className: "custom-class",
    children: [
      <CheckBoxItem key="1" label="Custom Class Option 1" onChange={() => {}} />,
      <CheckBoxItem key="2" label="Custom Class Option 2" onChange={() => {}} />,
    ],
  },
};

export const WithCustomStyle: Story = {
  args: {
    style: { maxWidth: "300px" },
    variant: "card",
    children: [
      <CheckBoxItem key="1" label="Custom Style Option 1" onChange={() => {}} />,
      <CheckBoxItem key="2" label="Custom Style Option 2" onChange={() => {}} />,
    ],
  },
};
