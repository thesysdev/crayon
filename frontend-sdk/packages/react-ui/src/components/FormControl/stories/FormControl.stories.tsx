import type { Meta, StoryObj } from "@storybook/react";
import { Info } from "lucide-react";
import { Input } from "../../Input";
import "../../Input/input.scss";
import { Label } from "../../Label";
import "../../Label/label.scss";
import { FormControl } from "../FormControl";
import { Hint } from "../Hint";
import "../Hint/hint.scss";

const meta: Meta<typeof FormControl> = {
  title: "Components/FormControl",
  component: FormControl,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  argTypes: {
    children: {
      control: false,
      description:
        "The child elements of the form control that accept Label, Input, and Hint components",
      table: {
        category: "Content",
        type: { summary: "ReactNode[] | ReactNode" },
        defaultValue: { summary: "undefined" },
      },
    },
    className: {
      control: false,
      description: "Additional CSS class name for custom styling",
      table: {
        category: "Styling",
        type: { summary: "string" },
        defaultValue: { summary: "undefined" },
      },
    },
    style: {
      control: false,
      description: "Inline CSS styles for custom styling",
      table: {
        category: "Styling",
        type: { summary: "CSSProperties" },
        defaultValue: { summary: "undefined" },
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof FormControl>;

export const WithLabelAndHint: Story = {
  render: () => (
    <FormControl>
      <Label>Username</Label>
      <Input placeholder="Enter username" />
      <Hint>
        <Info size={14} /> Must be at least 4 characters long
      </Hint>
    </FormControl>
  ),
};

export const WithMultipleChildren: Story = {
  render: () => (
    <FormControl>
      <Label htmlFor="profile-information">Profile Information</Label>
      <Input placeholder="Full name" id="profile-information" />
      <Input placeholder="Bio" />
      <Hint>This information will be displayed on your public profile</Hint>
    </FormControl>
  ),
};
