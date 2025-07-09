import type { Meta, StoryObj } from "@storybook/react";
import { Separator } from "../Separator";

const meta: Meta<typeof Separator> = {
  title: "Components/Separator",
  component: Separator,
  tags: ["autodocs", "!dev"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "```tsx\nimport { Separator } from '@crayon-ui/react-ui';\n```",
      },
    },
  },
  decorators: [
    (Story, { args }) => (
      <div style={args.orientation === "vertical" ? { height: "100px" } : { width: "100px" }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    orientation: {
      control: "radio",
      options: ["horizontal", "vertical"],
      description: "The orientation of the separator.",
      defaultValue: "horizontal",
    },
    decorative: {
      control: "boolean",
      description:
        "When ```true```, signifies that it is purely visual, carries no semantic meaning, and ensures it is not present in the accessibility tree.",
      defaultValue: false,
    },
  },
};

export default meta;
type Story = StoryObj<typeof Separator>;

export const Horizontal: Story = {
  args: {
    orientation: "horizontal",
  },
};

export const Vertical: Story = {
  args: {
    orientation: "vertical",
  },
};
