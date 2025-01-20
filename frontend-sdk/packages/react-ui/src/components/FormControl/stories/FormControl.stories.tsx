import type { Meta, StoryObj } from "@storybook/react";
import Input from "../../Input";
import FormControl from "../FormControl";
import { Hint } from "../Hint";
import { Label } from "../Label";

const meta: Meta<typeof FormControl> = {
  title: "Components/FormControl",
  component: FormControl,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof FormControl>;

export const Basic: Story = {
  args: {
    children: <Input placeholder="Enter text..." />,
  },
};

export const WithLabelAndHint: Story = {
  render: () => (
    <FormControl>
      <Label>Username</Label>
      <Input placeholder="Enter username" />
      <Hint>Must be at least 4 characters long</Hint>
    </FormControl>
  ),
};

export const WithCustomStyle: Story = {
  args: {
    children: (
      <>
        <Label>Email</Label>
        <Input placeholder="Enter email" />
        <Hint>We'll never share your email</Hint>
      </>
    ),
    style: {
      width: "300px",
      margin: "20px",
    },
  },
};

export const WithCustomClass: Story = {
  args: {
    children: (
      <>
        <Label>Password</Label>
        <Input type="password" placeholder="Enter password" />
        <Hint>Use a strong password with mixed characters</Hint>
      </>
    ),
    className: "custom-form-control",
  },
};

export const WithMultipleChildren: Story = {
  render: () => (
    <FormControl>
      <Label>Profile Information</Label>
      <Input placeholder="Full name" />
      <Input placeholder="Bio" />
      <Hint>This information will be displayed on your public profile</Hint>
    </FormControl>
  ),
};
