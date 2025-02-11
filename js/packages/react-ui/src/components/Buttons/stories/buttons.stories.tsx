import type { Meta, StoryObj } from "@storybook/react";
import { ArrowLeft } from "lucide-react";
import { Button } from "../../Button";
import { IconButton } from "../../IconButton";
import { Buttons } from "../Buttons";

const meta: Meta<typeof Buttons> = {
  title: "Components/Buttons",
  component: Buttons,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "```tsx\nimport { Buttons } from '@crayon-ui/react-ui';\n```",
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: "350px" }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    variant: {
      control: "radio",
      options: ["horizontal", "vertical"],
      table: {
        category: "Appearance",
        type: { summary: "'horizontal' | 'vertical'" },
        defaultValue: { summary: "'horizontal'" },
      },
    },
    children: {
      control: false,
      description: "The child elements of the footer that accept Button and IconButton components",
      table: {
        category: "Content",
        type: {
          summary:
            "ReactNode[]<ButtonProps | IconButtonProps> | ReactNode<ButtonProps | IconButtonProps>",
        },
      },
    },
    className: {
      control: false,
      description: "Additional CSS class name for custom styling",
      table: {
        category: "Styling",
        type: { summary: "string" },
      },
    },
    style: {
      control: false,
      description: "Inline CSS styles for custom styling",
      table: {
        category: "Styling",
        type: { summary: "CSSProperties" },
      },
    },
  },
  tags: ["!dev", "autodocs"],
};

export default meta;
type Story = StoryObj<typeof Buttons>;

// Basic footer stories
export const ButtonsStory: Story = {
  args: {
    variant: "horizontal",
  },
  render: (args) => (
    <Buttons variant={args.variant}>
      <Button>Cancel</Button>
      <Button>Save</Button>
      <IconButton icon={<ArrowLeft size={16} />} />
    </Buttons>
  ),
};
