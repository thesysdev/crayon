import type { Meta, StoryObj } from "@storybook/react";
import { ArrowLeft } from "lucide-react";
import { Button } from "../../Button";
import "../../Button/button.scss";
import { IconButton } from "../../IconButton";
import "../../IconButton/iconButton.scss";
import { Footer } from "../Footer";
import "../footer.scss";

const meta: Meta<typeof Footer> = {
  title: "Components/Footer",
  component: Footer,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "```tsx\nimport { CardFooter } from '@crayon-ui/react-ui';\n```",
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: "500px" }}>
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
  tags: ["!dev", "autodocs"],
};

export default meta;
type Story = StoryObj<typeof Footer>;

// Basic footer stories
export const FooterStory: Story = {
  args: {
    variant: "horizontal",
  },
  render: (args) => (
    <Footer variant={args.variant}>
      <Button>Cancel</Button>
      <Button>Save</Button>
      <IconButton icon={<ArrowLeft size={16} />} />
    </Footer>
  ),
};
