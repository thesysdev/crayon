import type { Meta, StoryObj } from "@storybook/react";
import { Heart, Star, User } from "lucide-react";
import { Tag } from "../../Tag";
import "../../Tag/tag.scss";
import { TagBlock } from "../TagBlock";
import "../TagBlock.scss";

const meta: Meta<typeof TagBlock> = {
  title: "Components/TagBlock",
  component: TagBlock,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "```tsx\nimport { TagBlock, Tag } from '@crayon-ui/react-ui';\n```",
      },
    },
  },
  argTypes: {
    children: {
      control: false,
      description: "Accepts Tag components as children",
      table: {
        category: "Content",
        type: { summary: "ReactElement<typeof Tag> | ReactElement<typeof Tag>[]" },
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
    styles: {
      control: false,
      description: "Additional CSS styles for custom styling",
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
type Story = StoryObj<typeof TagBlock>;

export const Default: Story = {
  render: (args) => (
    <TagBlock {...args}>
      <Tag icon={<User size={16} />} text="User" />
      <Tag icon={<Star size={16} />} text="Star" />
      <Tag icon={<Heart size={16} />} text="Heart" />
    </TagBlock>
  ),
};
