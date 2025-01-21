import type { Meta, StoryObj } from "@storybook/react";
import { FormControl, Label } from "../../FormControl";
import { Input } from "../../Input";
import { Card } from "../Card";
import "../card.scss";

const meta: Meta<typeof Card> = {
  title: "Components/Card",
  component: Card,
  parameters: {
    layout: "centered",
  },
  argTypes: {
    width: {
      control: "radio",
      options: ["standard", "full"],
    },
    variant: {
      control: "radio",
      options: ["card", "clear", "sunk"],
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Card>;

// Basic button stories
export const CardStory: Story = {
  args: {
    width: "standard",
    variant: "card",
  },
  render: (args) => (
    <div style={{ width: "500px" }}>
      <Card variant={args.variant} width={args.width}>
        <FormControl>
          <Label>Username</Label>
          <Input placeholder="Enter username" />
        </FormControl>
      </Card>
    </div>
  ),
};
