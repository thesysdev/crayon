import type { Meta, StoryObj } from "@storybook/react";
import { CardHeader } from "../../CardHeader";
import "../../CardHeader/cardHeader.scss";
import { FormControl } from "../../FormControl";
import "../../FormControl/formControl.scss";
import { Input } from "../../Input";
import "../../Input/input.scss";
import { Label } from "../../Label";
import "../../Label/label.scss";
import { Card } from "../Card";
import "../card.scss";

const meta: Meta<typeof Card> = {
  title: "Components/Card",
  component: Card,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "```tsx\nimport { Card } from '@crayon-ui/react-ui';\n```",
      },
    },
  },
  argTypes: {
    width: {
      control: "radio",
      options: ["standard", "full"],
      description: "Controls the width of the card component",
      table: {
        category: "Appearance",
        defaultValue: { summary: "standard" },
      },
    },
    variant: {
      control: "radio",
      options: ["card", "clear", "sunk"],
      description: "Determines the visual style of the card",

      table: {
        defaultValue: { summary: "card" },
        category: "Appearance",
      },
    },
  },
  tags: ["autodocs", "!dev"],
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
        <CardHeader title="Card Title" subtitle="Card Description" actions={[]} />
        <FormControl>
          <Label htmlFor="username">Username</Label>
          <Input id="username" placeholder="Enter username" />
        </FormControl>
      </Card>
    </div>
  ),
};
